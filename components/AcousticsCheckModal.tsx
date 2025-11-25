import React, { useState, useRef, useEffect } from 'react';
import { XIcon, SpeakerWaveIcon, PlayIcon, LoaderIcon, DownloadIcon, SlidersIcon, ArrowPathIcon } from './icons';
import { HeadphoneCalibrationEngine } from '../utils/audioEngine';
import HeadphoneCorrectionControls from './HeadphoneCorrectionControls';
import { CalibrationState, HeadphoneProfile } from '../types';
import AudioWaveform from './AudioWaveform';

interface AcousticsCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationState: CalibrationState;
  onCalibrationChange: (newState: CalibrationState) => void;
}

// Define simulation types sorted by Quality/Category logic (High Fidelity -> Low Fidelity/Effects)
type EnvironmentType = 
    | 'bypass' 
    | 'hifi' 
    | 'cubes'  // Reference
    | 'cinema' 
    | 'car_luxury'
    | 'car' 
    | 'car_compact'
    | 'living'
    | 'tv' 
    | 'laptop' 
    | 'phone' 
    | 'bluetooth' 
    | 'earbuds' 
    | 'gaming' 
    | 'radio' 
    | 'boombox' 
    | 'kitchen'
    | 'mono_small' 
    | 'megaphone' 
    | 'mall' 
    | 'landline' 
    | 'nextroom' 
    | 'underwater';

interface ReverbSettings {
    seconds: number; // Duration of the tail
    decay: number;   // How fast it fades
    mix: number;     // Wet level (0.0 to 1.0)
}

interface EnvironmentDef {
    name: string;
    description: string;
    gainCorrection: number; // Multiplier to prevent clipping
    reverb?: ReverbSettings; // Optional spatial simulation
    icon?: string; // Future use
}

// Ordered list for UI rendering: Quality -> Real World -> Low Fi -> FX
const environments: Record<EnvironmentType, EnvironmentDef> = {
    bypass: { 
        name: 'Estudio (Bypass)', 
        description: 'Señal original sin procesar. Respuesta plana.',
        gainCorrection: 1.0 
    },
    hifi: { 
        name: 'Hi-Fi System', 
        description: 'Curva "Sonrisa" (V-Shape). Graves profundos y agudos cristalinos.',
        gainCorrection: 0.6
    },
    cubes: { 
        name: 'Studio Cubes', 
        description: 'Referencia de medios (Auratone/Mixcube). Sin graves (<90Hz) ni brillo (>12k).',
        gainCorrection: 1.0
    },
    cinema: {
        name: 'Cine / Theater',
        description: 'Curva X con reverb de sala grande y tratada acústicamente.',
        gainCorrection: 0.5,
        reverb: { seconds: 1.5, decay: 2, mix: 0.25 }
    },
    car_luxury: {
        name: 'Sedán de Lujo',
        description: 'Insonorizado. Graves controlados pero potentes, ambiente muy seco.',
        gainCorrection: 0.6,
        reverb: { seconds: 0.3, decay: 5, mix: 0.05 }
    },
    car: { 
        name: 'Coche Estándar', 
        description: 'Boost en graves (80Hz), medios recortados. Ambiente pequeño y seco.',
        gainCorrection: 0.5,
        reverb: { seconds: 0.4, decay: 4, mix: 0.1 }
    },
    car_compact: {
        name: 'Coche Compacto',
        description: 'Menos aislamiento. Graves retumbantes (120Hz) y agudos agresivos.',
        gainCorrection: 0.6,
        reverb: { seconds: 0.5, decay: 4, mix: 0.15 }
    },
    living: {
        name: 'Sala de Estar',
        description: 'Muebles que absorben agudos, resonancia de sala doméstica.',
        gainCorrection: 0.8,
        reverb: { seconds: 0.8, decay: 3, mix: 0.2 }
    },
    tv: { 
        name: 'Smart TV', 
        description: 'Medios-graves ausentes, énfasis en inteligibilidad.',
        gainCorrection: 0.9,
        reverb: { seconds: 0.6, decay: 4, mix: 0.1 }
    },
    laptop: { 
        name: 'Laptop', 
        description: 'Corte en 200Hz, resonancia "plástica" en 1kHz.',
        gainCorrection: 0.9 
    },
    phone: { 
        name: 'Celular', 
        description: 'Sin graves (<400Hz), sin agudos, énfasis agresivo en medios.',
        gainCorrection: 1.0 
    },
    bluetooth: { 
        name: 'Speaker BT', 
        description: 'Graves inflados artificialmente (140Hz) y agudos limitados.',
        gainCorrection: 0.6
    },
    earbuds: { 
        name: 'Auriculares Baratos', 
        description: 'Graves débiles, medios-agudos estridentes (3kHz).',
        gainCorrection: 0.8
    },
    gaming: {
        name: 'Headset Gaming',
        description: 'Graves exagerados para explosiones, aislamiento total.',
        gainCorrection: 0.6
    },
    radio: {
        name: 'Radio Vintage',
        description: 'Ancho de banda limitado (400Hz-4kHz), sonido nasal AM.',
        gainCorrection: 1.0
    },
    boombox: {
        name: 'Boombox 90s',
        description: 'Botón "Bass Boost" activado. Graves sucios y medios huecos.',
        gainCorrection: 0.5
    },
    kitchen: {
        name: 'Cocina / Baño',
        description: 'Superficies duras. Mucho brillo y reverb metálica corta.',
        gainCorrection: 0.8,
        reverb: { seconds: 1.2, decay: 1.5, mix: 0.35 }
    },
    mono_small: {
        name: 'Radio Cocina (Mono)',
        description: 'Pequeño altavoz mono, sonido "cajón".',
        gainCorrection: 0.9
    },
    megaphone: {
        name: 'Megáfono',
        description: 'Solo medios altos (1kHz-2kHz), distorsión y rebote lejano.',
        gainCorrection: 0.5,
        reverb: { seconds: 1.0, decay: 1, mix: 0.2 }
    },
    mall: {
        name: 'Centro Comercial',
        description: 'Sonido difuso, distante y con gran cola de reverb fangosa.',
        gainCorrection: 0.9,
        reverb: { seconds: 3.0, decay: 1.5, mix: 0.4 }
    },
    landline: {
        name: 'Teléfono Fijo',
        description: 'Banda estrecha estricta (300Hz - 3.4kHz).',
        gainCorrection: 1.0
    },
    nextroom: { 
        name: 'Habitación de al lado', 
        description: 'Paredes gruesas. Solo pasan graves, reverb grave y difusa.',
        gainCorrection: 0.95,
        reverb: { seconds: 1.5, decay: 5, mix: 0.3 }
    },
    underwater: {
        name: 'Bajo el Agua',
        description: 'Filtro paso bajo extremo. Sensación de presión hidrostática.',
        gainCorrection: 0.95
    },
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AcousticsCheckModal: React.FC<AcousticsCheckModalProps> = ({ isOpen, onClose, calibrationState, onCalibrationChange }) => {
    const [activeEnv, setActiveEnv] = useState<EnvironmentType>('bypass');
    const [isPlaying, setIsPlaying] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
    
    // Player State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    
    // Sync Ref
    const isPlayingRef = useRef(false);
    
    // Calibration Engine Ref
    const calibrationEngineRef = useRef<HeadphoneCalibrationEngine | null>(null);

    // Nodes for FX Chain
    const filtersRef = useRef<BiquadFilterNode[]>([]);
    const convolverNodeRef = useRef<ConvolverNode | null>(null);
    const dryGainNodeRef = useRef<GainNode | null>(null);
    const wetGainNodeRef = useRef<GainNode | null>(null);

    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    // Visibility Handler to resume audio context
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Setup Audio Context & Calibration Engine - ONLY on open/close
    useEffect(() => {
        if (isOpen && !audioContextRef.current) {
            // Initialize Audio Context
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            
            // Initialize Calibration Engine
            calibrationEngineRef.current = new HeadphoneCalibrationEngine(audioContextRef.current);

            // Create shared nodes
            gainNodeRef.current = audioContextRef.current.createGain();

            // Create Reverb Routing Nodes
            dryGainNodeRef.current = audioContextRef.current.createGain();
            wetGainNodeRef.current = audioContextRef.current.createGain();
            convolverNodeRef.current = audioContextRef.current.createConvolver();

            // --- ROUTING CHAIN ---
            // 1. Calibration Engine Output -> Master Gain (Sim Input)
            calibrationEngineRef.current.getOutputNode().connect(gainNodeRef.current);

            // 2. Master Gain -> Destination (Default)
            gainNodeRef.current.connect(audioContextRef.current.destination);
            
            // Apply initial calibration state
            if (calibrationEngineRef.current) {
                calibrationEngineRef.current.loadProfile(calibrationState.profile);
                calibrationEngineRef.current.setAmount(calibrationState.amount);
                calibrationEngineRef.current.setBypass(calibrationState.bypass);
            }
        }

        return () => {
            // Cleanup on unmount or close
            stopAudio(false);
            if (audioContextRef.current) {
                try {
                    audioContextRef.current.close();
                } catch (e) {
                    console.warn("Error closing AudioContext", e);
                }
                audioContextRef.current = null;
            }
            if (calibrationEngineRef.current) {
                calibrationEngineRef.current.dispose();
                calibrationEngineRef.current = null;
            }
            setAudioBuffer(null);
            setFileName(null);
            setIsPlaying(false);
            setCurrentTime(0);
            isPlayingRef.current = false;
        };
    }, [isOpen]);

    // Separate effect for calibration updates
    useEffect(() => {
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }
    }, [calibrationState]);

    // --- Reverb Impulse Generator ---
    const generateImpulse = (duration: number, decay: number, reverse: boolean = false) => {
        if (!audioContextRef.current) return null;
        const sampleRate = audioContextRef.current.sampleRate;
        const length = sampleRate * duration;
        const impulse = audioContextRef.current.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            let n = reverse ? length - i : i;
            // Generate white noise with exponential decay
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    };

    // Handle File Upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !audioContextRef.current) return;

        // Limit 50MB
        if (file.size > 50 * 1024 * 1024) {
            setError("El archivo es demasiado grande (>50MB). Por favor, usa una versión más ligera o corta.");
            return;
        }

        setIsLoading(true);
        setError(null);
        stopAudio();

        try {
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);
            setFileName(file.name);
            pauseTimeRef.current = 0;
            setCurrentTime(0);
        } catch (e) {
            console.error(e);
            setError("Error al decodificar el audio. Formato no soportado.");
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (!audioContextRef.current || !audioBuffer || !calibrationEngineRef.current) return;

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        sourceNodeRef.current = audioContextRef.current.createBufferSource();
        sourceNodeRef.current.buffer = audioBuffer;
        sourceNodeRef.current.loop = true;

        // Connect Source -> Calibration Input
        sourceNodeRef.current.connect(calibrationEngineRef.current.getInputNode());

        const offset = pauseTimeRef.current % duration;
        sourceNodeRef.current.start(0, offset);
        startTimeRef.current = audioContextRef.current.currentTime - offset;

        setIsPlaying(true);
        isPlayingRef.current = true; // Sync Ref
        
        // Apply current environment to the chain immediately
        applyEnvironment(activeEnv);
        
        // Start loop
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        updateTime();
    };

    const stopAudio = (savePosition = true) => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current && savePosition) {
            pauseTimeRef.current = (audioContextRef.current.currentTime - startTimeRef.current) % duration;
        }
        setIsPlaying(false);
        isPlayingRef.current = false; // Sync Ref
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

    const togglePlay = () => {
        if (isPlaying) stopAudio();
        else playAudio();
    };

    const updateTime = () => {
        if (!isPlayingRef.current || !audioContextRef.current) return;
        
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const newTime = elapsed % duration;
        
        setCurrentTime(newTime);
        
        animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const handleSeek = (time: number) => {
        pauseTimeRef.current = time;
        setCurrentTime(time);
        if (isPlaying) {
            stopAudio(false); // Don't save old position, use the seeked time
            playAudio();
        }
    };

    // Apply Environment (EQ + Reverb)
    const applyEnvironment = (env: EnvironmentType) => {
        if (!audioContextRef.current || !gainNodeRef.current) {
             setActiveEnv(env); // Just update state if audio not ready
             return;
        }

        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        const def = environments[env];

        // 1. Gain Correction (Headroom)
        gainNodeRef.current.gain.cancelScheduledValues(now);
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
        gainNodeRef.current.gain.linearRampToValueAtTime(def.gainCorrection, now + 0.1);

        // 2. Reset Chain: Disconnect Sim Output (GainNode) from downstream
        gainNodeRef.current.disconnect();
        
        filtersRef.current.forEach(f => f.disconnect());
        filtersRef.current = [];
        
        // Disconnect Reverb path
        if (dryGainNodeRef.current) dryGainNodeRef.current.disconnect();
        if (wetGainNodeRef.current) wetGainNodeRef.current.disconnect();
        if (convolverNodeRef.current) convolverNodeRef.current.disconnect();

        // The Input to the Sim Chain is gainNodeRef.current (which comes from calibration)
        let chainInput: AudioNode = gainNodeRef.current;
        let lastEqNode: AudioNode = gainNodeRef.current;

        // --- BUILD EQ CHAIN ---
        let nodes: BiquadFilterNode[] = [];
        
        // ... (EQ Definitions - Simplified for length, refer to previous mapping) ...
         if (env === 'cubes') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 90; 
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 10000;
            const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1500; mid.gain.value = 3;
            nodes = [hpf, lpf, mid];
        } else if (env === 'hifi') {
            const lowShelf = ctx.createBiquadFilter(); lowShelf.type = 'lowshelf'; lowShelf.frequency.value = 100; lowShelf.gain.value = 5;
            const highShelf = ctx.createBiquadFilter(); highShelf.type = 'highshelf'; highShelf.frequency.value = 10000; highShelf.gain.value = 5;
            const midCut = ctx.createBiquadFilter(); midCut.type = 'peaking'; midCut.frequency.value = 1000; midCut.gain.value = -3;
            nodes = [lowShelf, highShelf, midCut];
        } else if (env === 'cinema') {
            const sub = ctx.createBiquadFilter(); sub.type = 'lowshelf'; sub.frequency.value = 80; sub.gain.value = 4;
            const xcurve = ctx.createBiquadFilter(); xcurve.type = 'highshelf'; xcurve.frequency.value = 2000; xcurve.gain.value = -3;
            nodes = [sub, xcurve];
        } else if (env === 'car_luxury') {
            const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 60; bass.gain.value = 3;
            const smoothHighs = ctx.createBiquadFilter(); smoothHighs.type = 'highshelf'; smoothHighs.frequency.value = 10000; smoothHighs.gain.value = -2;
            const midClean = ctx.createBiquadFilter(); midClean.type = 'peaking'; midClean.frequency.value = 300; midClean.gain.value = -2;
            nodes = [bass, smoothHighs, midClean];
        } else if (env === 'car') {
            const bassBoost = ctx.createBiquadFilter(); bassBoost.type = 'peaking'; bassBoost.frequency.value = 80; bassBoost.gain.value = 6;
            const midScoop = ctx.createBiquadFilter(); midScoop.type = 'peaking'; midScoop.frequency.value = 500; midScoop.gain.value = -4;
            const highShelf = ctx.createBiquadFilter(); highShelf.type = 'highshelf'; highShelf.frequency.value = 8000; highShelf.gain.value = 3;
            nodes = [bassBoost, midScoop, highShelf];
        } else if (env === 'car_compact') {
            const boom = ctx.createBiquadFilter(); boom.type = 'peaking'; boom.frequency.value = 110; boom.gain.value = 5; boom.Q.value = 2;
            const harsh = ctx.createBiquadFilter(); harsh.type = 'highshelf'; harsh.frequency.value = 6000; harsh.gain.value = 4;
            nodes = [boom, harsh];
        } else if (env === 'living') {
            const warm = ctx.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 200; warm.gain.value = 2;
            const absorbedHighs = ctx.createBiquadFilter(); absorbedHighs.type = 'highshelf'; absorbedHighs.frequency.value = 8000; absorbedHighs.gain.value = -4;
            const mode = ctx.createBiquadFilter(); mode.type = 'peaking'; mode.frequency.value = 150; mode.gain.value = 3; mode.Q.value = 4;
            nodes = [warm, absorbedHighs, mode];
        } else if (env === 'tv') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 150;
            const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 2000; presence.gain.value = 4;
            const highCut = ctx.createBiquadFilter(); highCut.type = 'highshelf'; highCut.frequency.value = 12000; highCut.gain.value = -6;
            nodes = [hpf, presence, highCut];
        } else if (env === 'laptop') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 200;
            const boxy = ctx.createBiquadFilter(); boxy.type = 'peaking'; boxy.frequency.value = 1000; boxy.Q.value = 2; boxy.gain.value = 6;
            nodes = [hpf, boxy];
        } else if (env === 'phone') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 400;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 10000; 
            const midBoost = ctx.createBiquadFilter(); midBoost.type = 'peaking'; midBoost.frequency.value = 3000; midBoost.Q.value = 1; midBoost.gain.value = 5;
            nodes = [hpf, lpf, midBoost];
        } else if (env === 'bluetooth') {
            const boomy = ctx.createBiquadFilter(); boomy.type = 'peaking'; boomy.frequency.value = 140; boomy.Q.value = 1.5; boomy.gain.value = 8;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 12000;
            nodes = [boomy, lpf];
        } else if (env === 'earbuds') {
            const bassCut = ctx.createBiquadFilter(); bassCut.type = 'highpass'; bassCut.frequency.value = 150;
            const harsh = ctx.createBiquadFilter(); harsh.type = 'peaking'; harsh.frequency.value = 3000; harsh.gain.value = 4;
            nodes = [bassCut, harsh];
        } else if (env === 'gaming') {
            const sub = ctx.createBiquadFilter(); sub.type = 'lowshelf'; sub.frequency.value = 100; sub.gain.value = 5;
            const steps = ctx.createBiquadFilter(); steps.type = 'peaking'; steps.frequency.value = 4000; steps.gain.value = 4; steps.Q.value = 1.5;
            nodes = [sub, steps];
        } else if (env === 'radio') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 400;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 4000;
            const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 2000; mid.gain.value = 3;
            nodes = [hpf, lpf, mid];
        } else if (env === 'boombox') {
            const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 120; bass.gain.value = 8;
            const mud = ctx.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 250; mud.gain.value = 3;
            nodes = [bass, mud];
        } else if (env === 'kitchen') {
            const bright = ctx.createBiquadFilter(); bright.type = 'highshelf'; bright.frequency.value = 4000; bright.gain.value = 5;
            const boxy = ctx.createBiquadFilter(); boxy.type = 'peaking'; boxy.frequency.value = 600; boxy.gain.value = 4;
            nodes = [bright, boxy];
        } else if (env === 'mono_small') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 300;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 6000;
            const boxy = ctx.createBiquadFilter(); boxy.type = 'peaking'; boxy.frequency.value = 600; boxy.gain.value = 5;
            nodes = [hpf, lpf, boxy];
        } else if (env === 'megaphone') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 800;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2500;
            const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 1500; peak.gain.value = 10;
            nodes = [hpf, lpf, peak];
        } else if (env === 'mall') {
            const dist = ctx.createBiquadFilter(); dist.type = 'highshelf'; dist.frequency.value = 3000; dist.gain.value = -10;
            const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 800; mid.gain.value = 3;
            nodes = [dist, mid];
        } else if (env === 'landline') {
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 300;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 3400;
            nodes = [hpf, lpf];
        } else if (env === 'nextroom') {
            const lpf1 = ctx.createBiquadFilter(); lpf1.type = 'lowpass'; lpf1.frequency.value = 200; lpf1.Q.value = 1;
            const lpf2 = ctx.createBiquadFilter(); lpf2.type = 'lowpass'; lpf2.frequency.value = 200; lpf2.Q.value = 1;
            nodes = [lpf1, lpf2];
        } else if (env === 'underwater') {
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 300; lpf.Q.value = 1;
            nodes = [lpf];
        }

        // Connect EQ Chain
        if (nodes.length > 0) {
            chainInput.connect(nodes[0]);
            for (let i = 0; i < nodes.length - 1; i++) {
                nodes[i].connect(nodes[i + 1]);
            }
            lastEqNode = nodes[nodes.length - 1];
            filtersRef.current = nodes;
        }

        // --- BUILD REVERB / OUTPUT CHAIN ---
        // If the environment has reverb definition, split the signal
        if (def.reverb && convolverNodeRef.current && dryGainNodeRef.current && wetGainNodeRef.current) {
            // 1. Generate Impulse
            const impulse = generateImpulse(def.reverb.seconds, def.reverb.decay);
            if (impulse) {
                convolverNodeRef.current.buffer = impulse;
            }

            // 2. Set Levels
            dryGainNodeRef.current.gain.value = 1.0; // Dry full signal (usually)
            wetGainNodeRef.current.gain.value = def.reverb.mix;

            // 3. Route: EQ -> DryGain -> Analyser
            lastEqNode.connect(dryGainNodeRef.current);
            dryGainNodeRef.current.connect(audioContextRef.current.destination);

            // 4. Route: EQ -> Convolver -> WetGain -> Analyser
            lastEqNode.connect(convolverNodeRef.current);
            convolverNodeRef.current.connect(wetGainNodeRef.current);
            wetGainNodeRef.current.connect(audioContextRef.current.destination);
        } else {
            // No Reverb: EQ -> Analyser
            lastEqNode.connect(audioContextRef.current.destination);
        }
        
        setActiveEnv(env);
    };


    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
            <div
                className="relative bg-[#0a0a0a] backdrop-blur-xl border border-theme-border-secondary rounded-lg shadow-2xl w-full max-w-5xl flex flex-col animate-scale-up overflow-hidden max-h-[95vh] pt-safe pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- Header & Toolbar --- */}
                <div className="flex flex-col border-b border-theme-border-secondary/50 z-20 relative">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center p-3 bg-[#111]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                                <SpeakerWaveIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">ACOUSTIC SIMULATOR</span>
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
                                    <button onClick={() => { setAudioBuffer(null); setFileName(null); setIsPlaying(false); isPlayingRef.current = false; stopAudio(); }} className="text-gray-500 hover:text-red-400">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Sub-Toolbar (Transport & Calibration) */}
                    <div className="flex flex-wrap items-center gap-4 p-3 bg-[#0f0f0f] text-xs border-t border-black/50">
                        {/* Play/Pause Button */}
                        <button 
                            onClick={togglePlay}
                            disabled={!audioBuffer}
                            className={`px-4 py-1 rounded font-bold flex items-center gap-2 transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-theme-accent/20 text-theme-accent border border-theme-accent/50 hover:bg-theme-accent/30'} ${!audioBuffer ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <PlayIcon className="w-3 h-3" />
                            {isPlaying ? 'PAUSE' : 'PLAY'}
                        </button>

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
                        
                        <div className="text-gray-500 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
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

                {/* --- Main Dashboard Area --- */}
                <div className="flex-grow p-4 lg:p-6 flex flex-col gap-4 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
                    
                    {/* 1. The "Monitor" Screen */}
                    <div className="relative w-full bg-[#080808] rounded-xl border border-gray-800 overflow-hidden shadow-inner min-h-[180px] flex flex-col justify-center items-center group">
                        {audioBuffer ? (
                            <>
                                <div className="absolute inset-0 opacity-80">
                                    <AudioWaveform 
                                        buffer={audioBuffer}
                                        progress={currentTime}
                                        onSeek={handleSeek}
                                        height={180}
                                        color="#1e293b"
                                        progressColor="#0ea5e9"
                                    />
                                </div>
                                {/* Screen Overlay Info */}
                                <div className="absolute top-4 left-4 pointer-events-none z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Environment</span>
                                        <span className="text-xl font-bold text-white drop-shadow-md">{environments[activeEnv].name}</span>
                                    </div>
                                </div>
                                {environments[activeEnv].reverb && (
                                    <div className="absolute top-4 right-4 pointer-events-none z-10">
                                        <div className="text-[10px] font-bold text-theme-accent-secondary bg-theme-accent-secondary/10 px-2 py-1 rounded border border-theme-accent-secondary/20 animate-pulse">
                                            SPATIAL SIM ON
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10 text-center">
                                    <p className="text-xs text-gray-400 bg-black/60 px-3 py-1 rounded inline-block backdrop-blur-sm border border-white/5">
                                        {environments[activeEnv].description}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-10 h-10 text-theme-accent animate-spin" />
                                        <p className="text-sm font-mono text-theme-accent">DECODING AUDIO...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 border-2 border-dashed border-gray-700 rounded flex items-center justify-center">
                                            <span className="text-gray-700 font-bold text-xs">NO SIGNAL</span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">Please Load Audio File</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Environment Grid (Control Pads) */}
                    <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Environment Selector</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {(Object.keys(environments) as EnvironmentType[]).map(env => (
                                <button
                                    key={env}
                                    onClick={() => applyEnvironment(env)}
                                    disabled={!audioBuffer}
                                    className={`
                                        relative h-16 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-200
                                        ${activeEnv === env 
                                            ? 'bg-theme-accent/10 border-theme-accent text-white shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.2)]' 
                                            : 'bg-[#1a1a1a] border-gray-800 text-gray-500 hover:bg-[#222] hover:text-gray-300 hover:border-gray-600'
                                        }
                                        ${!audioBuffer ? 'opacity-40 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide z-10 text-center px-1 leading-tight">{environments[env].name}</span>
                                    {activeEnv === env && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-theme-accent shadow-[0_0_5px_var(--theme-accent)] absolute top-2 right-2"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded text-xs text-center">
                            {error}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AcousticsCheckModal;