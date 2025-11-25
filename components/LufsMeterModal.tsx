import React, { useState, useRef, useEffect } from 'react';
import { XIcon, SpeedometerIcon, PlayIcon, DownloadIcon, ArrowPathIcon, SlidersIcon, LoaderIcon } from './icons';
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

// --- AudioWorklet Code as a Template String ---
const workletCode = `
class LufsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sumSquaresIntegrated = 0;
    this.sampleCountIntegrated = 0;
    this.momentaryWindowSize = 0.4; 
    this.momentaryBuffer = [];
    this.momentarySum = 0;
    this.shortTermWindowSize = 3.0;
    this.shortTermBuffer = [];
    this.shortTermSum = 0;
    this.maxPeak = 0;
    this.clipCount = 0;
    this.rmsBuffer = [];
    this.rmsSum = 0;
    this.sampleRate = 48000; 
    this.lastPostTime = 0;
  }

  static get parameterDescriptors() {
    return [{ name: 'reset', defaultValue: 0 }];
  }

  process(inputs, outputs, parameters) {
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
        this.maxPeak = 0;
        this.clipCount = 0;
    }

    const inputK = inputs[0];
    const inputRaw = inputs[1];
    
    if (!inputK || inputK.length === 0) return true;

    const channelCount = inputK.length;
    const bufferSize = inputK[0].length;
    this.sampleRate = sampleRate; 

    // --- 1. LUFS CALCULATIONS (Input 0 - K-Weighted) ---
    let blockSumSquares = 0;
    for (let i = 0; i < bufferSize; i++) {
        let channelSum = 0;
        for (let c = 0; c < channelCount; c++) {
            const sample = inputK[c][i];
            channelSum += sample * sample;
        }
        blockSumSquares += channelSum; 
    }

    const momentarySamples = Math.floor(this.sampleRate * 0.4);
    this.momentaryBuffer.push({ sum: blockSumSquares, count: bufferSize });
    this.momentarySum += blockSumSquares;
    let currentSamples = this.momentaryBuffer.reduce((a, b) => a + b.count, 0);
    while (currentSamples > momentarySamples) {
        const removed = this.momentaryBuffer.shift();
        this.momentarySum -= removed.sum;
        currentSamples -= removed.count;
    }

    const shortTermSamples = Math.floor(this.sampleRate * 3.0);
    this.shortTermBuffer.push({ sum: blockSumSquares, count: bufferSize });
    this.shortTermSum += blockSumSquares;
    currentSamples = this.shortTermBuffer.reduce((a, b) => a + b.count, 0);
    while (currentSamples > shortTermSamples) {
        const removed = this.shortTermBuffer.shift();
        this.shortTermSum -= removed.sum;
        currentSamples -= removed.count;
    }

    const blockRMS = Math.sqrt(blockSumSquares / (bufferSize * channelCount));
    const blockDb = 20 * Math.log10(blockRMS + 1e-9);
    if (blockDb > -70) {
        this.sumSquaresIntegrated += blockSumSquares;
        this.sampleCountIntegrated += (bufferSize * channelCount);
    }
    
    // --- 2. RMS & PEAK CALCULATIONS (Input 1 - Raw) ---
    let rawSumSquares = 0;
    let currentBlockPeak = 0;
    let activeRawChannels = 1;
    
    if (inputRaw && inputRaw.length > 0) {
        activeRawChannels = inputRaw.length;
        for (let i = 0; i < bufferSize; i++) {
            let chSum = 0;
            for (let c = 0; c < activeRawChannels; c++) {
                const rawSample = inputRaw[c][i];
                chSum += rawSample * rawSample;
                const absSample = Math.abs(rawSample);
                if (absSample > currentBlockPeak) currentBlockPeak = absSample;
                if (absSample >= 1.0) this.clipCount++;
            }
            rawSumSquares += chSum;
        }
        if (currentBlockPeak > this.maxPeak) this.maxPeak = currentBlockPeak;
        
        this.rmsBuffer.push({ sum: rawSumSquares, count: bufferSize });
        this.rmsSum += rawSumSquares;
        let currentRmsSamples = this.rmsBuffer.reduce((a, b) => a + b.count, 0);
        while (currentRmsSamples > momentarySamples) {
            const removed = this.rmsBuffer.shift();
            this.rmsSum -= removed.sum;
            currentRmsSamples -= removed.count;
        }
    }

    if (currentTime - this.lastPostTime > 0.032) { 
        const calcLoudness = (sum, count) => {
            if (count === 0) return -100;
            const ms = sum / (count / channelCount); 
            return -0.691 + 10 * Math.log10(ms + 1e-9); 
        };
        
        const calcRMS = (sum, count, channels) => {
             if (count === 0) return -100;
             const totalSamples = count * channels;
             const meanSquare = sum / totalSamples;
             const dbMath = 10 * Math.log10(meanSquare + 1e-9);
             return dbMath + 3.01;
        };

        const mCount = this.momentaryBuffer.reduce((a,b) => a + b.count, 0) * channelCount;
        const sCount = this.shortTermBuffer.reduce((a,b) => a + b.count, 0) * channelCount;
        const rmsFrames = this.rmsBuffer.reduce((a,b) => a + b.count, 0);

        const m = calcLoudness(this.momentarySum, mCount);
        const s = calcLoudness(this.shortTermSum, sCount);
        const i = calcLoudness(this.sumSquaresIntegrated, this.sampleCountIntegrated);
        const p = 20 * Math.log10(this.maxPeak + 1e-9);
        const rms = calcRMS(this.rmsSum, rmsFrames, activeRawChannels);
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
            { name: 'Apple Music (Standard)', value: -16 },
            { name: 'SoundCloud (High)', value: -9 },
            { name: 'Deezer', value: -14 },
        ]
    },
    {
        label: "Redes Sociales",
        options: [
            { name: 'TikTok / Instagram / Reels', value: -14 },
            { name: 'Facebook Video', value: -16 },
        ]
    },
    {
        label: "Estándares de Género (Competitivo)",
        options: [
            { name: 'EDM / Dubstep / Club (Extremo)', value: -5 },
            { name: 'Techno / House (Loud)', value: -6 },
            { name: 'Trap / Reggaeton / Hip-Hop (Modern)', value: -7 },
            { name: 'Pop Comercial / Mainstream', value: -8 },
            { name: 'Rock Moderno / Metal', value: -9 },
            { name: 'R&B / Soul Moderno', value: -10 },
            { name: 'Balada / Pop Acústico', value: -12 },
            { name: 'Jazz / Instrumental / Folk', value: -16 },
            { name: 'Música Clásica (Dinámica Alta)', value: -20 },
        ]
    },
    {
        label: "Broadcast & Cine (Normativas)",
        options: [
            { name: 'TV Europa (EBU R128)', value: -23 },
            { name: 'TV USA (ATSC A/85)', value: -24 },
            { name: 'Netflix / Disney+ / Streaming Video', value: -27 },
            { name: 'Cine (AES Streaming)', value: -27 },
            { name: 'Cine (Theatrical)', value: -31 },
        ]
    },
    {
        label: "Soportes Físicos",
        options: [
            { name: 'CD Audio (Loudness War Era)', value: -9 },
            { name: 'CD Audio (Audiophile)', value: -14 },
            { name: 'Vinilo (Recomendado)', value: -16 },
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

    // Handle Open/Close lifecycle
    useEffect(() => {
        if (isOpen) {
            if (!audioContext) {
                initAudio();
            }
        } else {
            // Close Logic
            cleanupAudio();
        }
        return () => {
            // Unmount Logic (Safe check)
            if (!isOpen) {
                cleanupAudio();
            }
        };
    }, [isOpen]);

    // Waveform Synchronization Loop
    useEffect(() => {
        const updateWaveform = () => {
            if (audioElementRef.current && isPlaying) {
                setCurrentTime(audioElementRef.current.currentTime);
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            }
        };

        if (isPlaying) {
            updateWaveform();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying]);

    // Calibration Sync
    useEffect(() => {
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }
    }, [calibrationState]);

    const initAudio = async () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            setAudioContext(ctx);

            // 1. Load Worklet
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await ctx.audioWorklet.addModule(url);

            // 2. Create Filters (K-Weighting Approximation)
            const filter1 = ctx.createBiquadFilter();
            filter1.type = 'highshelf';
            filter1.frequency.value = 1500;
            filter1.gain.value = 4.0;
            filter1.Q.value = 1.0; 

            const filter2 = ctx.createBiquadFilter();
            filter2.type = 'highpass';
            filter2.frequency.value = 38; 
            filter2.Q.value = 1.0;

            // 3. Create Worklet Node (2 inputs: 0=K-Weighted, 1=Raw)
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
                
                // Update History for Canvas
                historyRef.current.push(s); 
                if (historyRef.current.length > 200) historyRef.current.shift();
                drawGraph();
            };
            workletNodeRef.current = lufsNode;
            
            // Get reset parameter
            const resetParam = lufsNode.parameters.get('reset');
            if (resetParam) resetParamRef.current = resetParam;

            // 4. Audio Source Setup
            const audioEl = new Audio();
            audioEl.crossOrigin = "anonymous";
            audioEl.loop = true;
            audioElementRef.current = audioEl;

            const source = ctx.createMediaElementSource(audioEl);
            sourceNodeRef.current = source;

            // 5. Calibration Engine
            calibrationEngineRef.current = new HeadphoneCalibrationEngine(ctx);
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);

            // --- ROUTING ---
            // Path A: LUFS Analysis (Source -> K-Filters -> Worklet Input 0)
            source.connect(filter1);
            filter1.connect(filter2);
            filter2.connect(lufsNode, 0, 0);

            // Path B: RMS/PEAK Analysis (Source Raw -> Worklet Input 1)
            // This is the Raw Signal Check
            source.connect(lufsNode, 0, 1);

            // Path C: Monitoring (Source -> Calibration -> Speakers)
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
            audioElementRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.dispose();
            calibrationEngineRef.current = null;
        }
        if (audioContext) {
            try { audioContext.close(); } catch(e) {}
            setAudioContext(null);
        }
        if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        setFileName(null);
        setIsPlaying(false);
        setAudioBuffer(null);
        setDuration(0);
        setCurrentTime(0);
        setMomentary(-100);
        setShortTerm(-100);
        setIntegrated(-100);
        setMaxPeak(-100);
        setRms(-100);
        setIsClipping(false);
        historyRef.current = new Array(200).fill(-60);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !audioElementRef.current || !audioContext) return;
        
        // Limit 50MB
        if (file.size > 50 * 1024 * 1024) {
            setError("El archivo es demasiado grande (>50MB).");
            return;
        }

        setIsLoading(true);
        setError(null);
        handleResetMeter();

        const url = URL.createObjectURL(file);
        audioElementRef.current.src = url;
        setFileName(file.name);

        // Decode for Waveform
        try {
            const arrayBuffer = await file.arrayBuffer();
            const decoded = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(decoded);
            setDuration(decoded.duration);
        } catch(e) {
            console.error("Error decoding for waveform", e);
            setError("Error al decodificar para la visualización.");
        } finally {
            setIsLoading(false);
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    };

    const handleResetMeter = () => {
        setMomentary(-100);
        setShortTerm(-100);
        setIntegrated(-100);
        setMaxPeak(-100);
        setRms(-100);
        setIsClipping(false);
        historyRef.current = new Array(200).fill(-60);
        
        if (resetParamRef.current && audioContext) {
            resetParamRef.current.setValueAtTime(1, audioContext.currentTime);
            resetParamRef.current.setValueAtTime(0, audioContext.currentTime + 0.1);
        }
    };

    const togglePlay = () => {
        if (!audioElementRef.current) return;
        if (audioContext?.state === 'suspended') audioContext.resume();

        if (isPlaying) {
            audioElementRef.current.pause();
        } else {
            audioElementRef.current.play();
        }
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

        // Gradient Background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(20,20,20,0)");
        gradient.addColorStop(1, "rgba(20,20,20,0.5)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0, width, height);

        // Grid lines
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        
        // Dynamic Target Line
        const userTargetY = getY(targetLufs, height);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // Green
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, userTargetY);
        ctx.lineTo(width, userTargetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Graph Line
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0ea5e9'; // Blue
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#0ea5e9';
        
        const step = width / data.length;
        
        for (let i = 0; i < data.length; i++) {
            const val = data[i];
            const y = getY(val, height);
            if (i === 0) ctx.moveTo(0, y);
            else ctx.lineTo(i * step, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    };

    const getY = (db: number, height: number) => {
        const min = -45;
        const max = -5;
        const norm = (db - min) / (max - min); 
        const clamped = Math.max(0, Math.min(1, norm));
        return height - (clamped * height);
    };

    // --- Render Helpers ---
    const getBarColor = (val: number, target: number) => {
        if (val > target + 2) return 'bg-theme-danger shadow-[0_0_15px_rgba(239,68,68,0.6)]';
        if (val > target - 2) return 'bg-theme-success shadow-[0_0_15px_rgba(34,197,94,0.6)]'; 
        if (val > -60) return 'bg-theme-priority';
        return 'bg-gray-800';
    };

    const getBarWidth = (val: number) => {
        const p = (val + 60) / 60 * 100;
        return Math.max(0, Math.min(100, p));
    };

    const getPeakColor = (peak: number, clipped: boolean) => {
        if (clipped) return 'text-white bg-red-600 px-1 rounded animate-pulse shadow-[0_0_10px_red]';
        if (peak > -0.1) return 'text-red-500'; 
        if (peak > -1.0) return 'text-yellow-500';
        return 'text-green-500';
    };

    const isLowEndHeavy = rms > shortTerm + 3 && momentary > -50;

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
            <div
                className="relative bg-[#0a0a0a] backdrop-blur-xl border border-theme-border-secondary rounded-lg shadow-2xl w-full max-w-6xl flex flex-col animate-scale-up overflow-hidden max-h-[95vh] pt-safe pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- Header & Toolbar --- */}
                <div className="flex flex-col border-b border-theme-border-secondary/50 z-20 relative">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center p-3 bg-[#111]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                                <SpeedometerIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">PRO LUFS METER</span>
                            </h2>
                            {/* Compact File Controls */}
                            {!fileName ? (
                                <label className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded bg-theme-accent/10 hover:bg-theme-accent/20 text-xs text-theme-accent transition-colors border border-theme-accent/30">
                                    <DownloadIcon className="w-3 h-3" />
                                    <span>Cargar Audio</span>
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                </label>
                            ) : (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                    <span className="text-xs text-gray-300 truncate max-w-[150px]">{fileName}</span>
                                    <button onClick={() => { 
                                        setFileName(null); 
                                        setIsPlaying(false); 
                                        handleResetMeter();
                                        if(audioElementRef.current) {
                                            audioElementRef.current.pause();
                                            audioElementRef.current.src = "";
                                        }
                                        setAudioBuffer(null);
                                    }} className="text-gray-500 hover:text-red-400">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleResetMeter} 
                                className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Reset Meter"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Sub-Toolbar (Target & Calibration) */}
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
                                            <option value={opt.value} key={opt.name}>
                                                {opt.name} ({opt.value})
                                            </option>
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
                        
                        {/* Transport */}
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
                    
                    {/* Collapsible Calibration Panel */}
                    {isCalibrationOpen && (
                        <div className="p-4 bg-[#151515] border-t border-gray-800 animate-fade-in-step relative z-30">
                            <HeadphoneCorrectionControls 
                                calibrationState={calibrationState}
                                onCalibrationChange={onCalibrationChange}
                            />
                        </div>
                    )}
                </div>

                 {/* --- Waveform Scrubber Area --- */}
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
                            {isLoading ? (
                                <>
                                    <LoaderIcon className="w-4 h-4 animate-spin" />
                                    Decoding...
                                </>
                            ) : (
                                "No Audio Loaded"
                            )}
                        </div>
                    )}
                     {error && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-500 text-xs font-bold">
                            {error}
                        </div>
                    )}
                 </div>


                {/* --- Main Dashboard Area --- */}
                <div className="flex-grow p-4 lg:p-6 flex flex-col gap-6 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
                    
                    {/* Upper Section: Metrics & Graph */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT PANEL: The "Big Numbers" */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            {/* Integrated Display */}
                            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-inner min-h-[180px]">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Integrated Loudness</p>
                                
                                <div className="text-center flex flex-col items-center">
                                    <span className={`text-7xl md:text-8xl font-mono font-bold tracking-tighter leading-none ${getBarColor(integrated, targetLufs).replace('bg-', 'text-').split(' ')[0]}`}>
                                        {integrated <= -99 ? '--' : integrated.toFixed(1)}
                                    </span>
                                    <span className="text-lg text-gray-600 font-medium">LUFS</span>
                                </div>
                                
                                {/* Target Delta Indicator (Relative Positioning) */}
                                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border transition-opacity duration-300 ${integrated > -99 ? 'opacity-100' : 'opacity-0'} ${Math.abs(integrated - targetLufs) < 2 ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                    {integrated > targetLufs ? '+' : ''}{(integrated - targetLufs).toFixed(1)} LU
                                </div>
                            </div>

                            {/* Secondary Metrics Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* True Peak Box */}
                                <div className={`bg-[#111] border ${isClipping ? 'border-red-500/50 bg-red-900/10' : 'border-gray-800'} rounded-xl p-4 flex flex-col items-center justify-center`}>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">True Peak</p>
                                    <span className={`text-2xl font-mono font-bold ${getPeakColor(maxPeak, isClipping)}`}>
                                        {maxPeak <= -99 ? '--' : maxPeak.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-600">dBTP</span>
                                </div>

                                {/* RMS Box */}
                                <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">RMS (AES-17)</p>
                                    <span className="text-2xl font-mono font-bold text-purple-400">
                                        {rms <= -99 ? '--' : rms.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-600">dB</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: The Graph */}
                        <div className="lg:col-span-8 bg-[#0a0a0a] border border-gray-800 rounded-xl relative overflow-hidden min-h-[250px]">
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] text-gray-400 uppercase">Short Term History</span>
                            </div>
                            <canvas ref={canvasRef} width={800} height={250} className="w-full h-full opacity-90" />
                            
                            {/* Target Line Label on Graph */}
                            <div 
                                className="absolute right-2 text-[10px] text-green-500 font-mono bg-black/50 px-1 rounded"
                                style={{ bottom: `${((targetLufs + 45) / 40) * 100}%` }} 
                            >
                                {targetLufs}
                            </div>

                            {/* Warning Message Overlay (Centered) */}
                            {isLowEndHeavy && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <span className="bg-black/80 border border-yellow-500 text-yellow-500 px-4 py-2 rounded-lg font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)] backdrop-blur-md animate-pulse flex items-center gap-2">
                                        ⚠️ Posible exceso de graves (Low-End Heavy)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lower Section: The "Meter Bridge" */}
                    <div className="grid grid-cols-1 gap-4 bg-[#111] p-5 rounded-xl border border-gray-800">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Real-time Dynamics</h3>
                        
                        {/* Short Term Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-300 w-24">Short Term</span>
                                <span className="font-mono text-theme-accent-secondary">{shortTerm <= -99 ? '-Inf' : shortTerm.toFixed(1)} LUFS</span>
                            </div>
                            <div className="h-6 w-full bg-gray-900 rounded overflow-hidden border border-gray-700 relative">
                                {/* Target Marker */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 opacity-60" style={{ left: `${((targetLufs + 60)/60)*100}%` }}></div>
                                <div 
                                    className={`h-full transition-all duration-300 ease-out ${getBarColor(shortTerm, targetLufs)}`} 
                                    style={{ width: `${getBarWidth(shortTerm)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Momentary Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-400 w-24">Momentary</span>
                                <span className="font-mono text-theme-accent">{momentary <= -99 ? '-Inf' : momentary.toFixed(1)} LUFS</span>
                            </div>
                            <div className="h-4 w-full bg-gray-900 rounded overflow-hidden border border-gray-700 relative">
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 opacity-30" style={{ left: `${((targetLufs + 60)/60)*100}%` }}></div>
                                <div 
                                    className={`h-full transition-all duration-100 ease-linear ${getBarColor(momentary, targetLufs)}`} 
                                    style={{ width: `${getBarWidth(momentary)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* RMS Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-500 w-24">RMS (Raw)</span>
                                <span className="font-mono text-purple-400">{rms <= -99 ? '-Inf' : rms.toFixed(1)} dB</span>
                            </div>
                            <div className="h-3 w-full bg-gray-900 rounded overflow-hidden border border-gray-800 relative">
                                <div 
                                    className="h-full transition-all duration-100 ease-linear bg-purple-900"
                                    style={{ width: `${getBarWidth(rms)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LufsMeterModal;