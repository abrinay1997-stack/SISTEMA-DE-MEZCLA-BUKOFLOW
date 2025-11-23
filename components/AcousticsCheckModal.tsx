
import React, { useState, useRef, useEffect } from 'react';
import { XIcon, SpeakerWaveIcon, PlayIcon, LoaderIcon } from './icons';
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
}

// Ordered list for UI rendering: Quality -> Real World -> Low Fi -> FX
const environments: Record<EnvironmentType, EnvironmentDef> = {
    bypass: { 
        name: 'Estudio (Bypass)', 
        description: 'Señal original sin procesar.',
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
    
    // Player State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    
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
        }
        
        // Update calibration when props change
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }

        return () => {
            // Cleanup on unmount
            if (!isOpen) {
                stopAudio();
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                if (calibrationEngineRef.current) {
                    calibrationEngineRef.current.dispose();
                    calibrationEngineRef.current = null;
                }
                setAudioBuffer(null);
                setFileName(null);
            }
        };
    }, [isOpen, calibrationState]);

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
        
        // Apply current environment to the chain immediately
        applyEnvironment(activeEnv);
        
        requestAnimationFrame(updateTime);
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
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

    const togglePlay = () => {
        if (isPlaying) stopAudio();
        else playAudio();
    };

    const updateTime = () => {
        if (!isPlaying || !audioContextRef.current) return;
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(elapsed % duration);
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
        
        // ... (EQ Definitions) ...
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
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg shadow-accent-lg w-full max-w-5xl flex flex-col animate-scale-up overflow-hidden max-h-[95vh] pt-safe pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-theme-border bg-black/20">
                    <h2 className="text-xl font-bold text-theme-accent flex items-center gap-2">
                        <SpeakerWaveIcon className="w-6 h-6" />
                        Simulador de Entornos
                    </h2>
                    <button onClick={onClose} className="p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Headphone Correction Module (Controlled) */}
                    <HeadphoneCorrectionControls 
                        calibrationState={calibrationState}
                        onCalibrationChange={onCalibrationChange}
                    />

                    {/* File Upload / Player Section */}
                    <div className="flex flex-col gap-4">
                         {!audioBuffer ? (
                            isLoading ? (
                                <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-theme-border rounded-lg bg-black/20">
                                    <LoaderIcon className="w-8 h-8 text-theme-accent mb-2" />
                                    <p className="text-sm text-theme-text animate-pulse">Decodificando Audio...</p>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-theme-border rounded-lg cursor-pointer bg-black/20 hover:bg-white/5 transition-colors">
                                    <div className="flex flex-col items-center justify-center">
                                        <SpeakerWaveIcon className="w-8 h-8 text-theme-text-secondary mb-1" />
                                        <p className="text-sm text-theme-text font-semibold">Cargar mezcla (MP3/WAV) - Max 50MB</p>
                                    </div>
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                </label>
                            )
                         ) : (
                             <div className="w-full flex flex-col gap-2 bg-black/30 p-3 rounded-lg border border-theme-border/50">
                                 <div className="flex items-center justify-between gap-4 mb-2">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <button 
                                            onClick={togglePlay}
                                            className="flex-shrink-0 w-10 h-10 rounded-full bg-theme-accent text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                         >
                                            {isPlaying ? (
                                                <div className="flex gap-0.5">
                                                    <div className="w-1 h-3 bg-white rounded-sm"></div>
                                                    <div className="w-1 h-3 bg-white rounded-sm"></div>
                                                </div>
                                            ) : (
                                                <PlayIcon className="w-4 h-4 ml-0.5" />
                                            )}
                                         </button>
                                         <div className="flex flex-col truncate">
                                             <span className="font-bold text-sm text-theme-text truncate">{fileName}</span>
                                             <button onClick={() => { setAudioBuffer(null); setIsPlaying(false); }} className="text-xs text-theme-text-secondary underline hover:text-theme-text text-left">Cambiar archivo</button>
                                         </div>
                                     </div>
                                     <div className="text-xs font-mono text-theme-text-secondary">
                                         {formatTime(currentTime)} / {formatTime(duration)}
                                     </div>
                                 </div>
                                 
                                 {/* Waveform Player */}
                                 <div className="w-full bg-black/50 rounded h-16 border border-theme-border overflow-hidden relative">
                                     <AudioWaveform 
                                        buffer={audioBuffer}
                                        progress={currentTime}
                                        onSeek={handleSeek}
                                        height={64}
                                        color="#334155"
                                        progressColor="#0ea5e9"
                                     />
                                     <div className="absolute top-2 right-2 pointer-events-none flex flex-col items-end gap-1">
                                        <div className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                                            {environments[activeEnv].name}
                                        </div>
                                        {environments[activeEnv].reverb && (
                                            <div className="text-[9px] text-theme-accent-secondary bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                                                Spatial Sim ON
                                            </div>
                                        )}
                                     </div>
                                 </div>
                             </div>
                         )}
                         {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                    </div>

                    {/* Environment Selectors */}
                    <div className="flex-grow overflow-y-auto">
                        <h3 className="text-sm font-bold text-theme-text-secondary uppercase tracking-wider mb-3 sticky top-0 bg-theme-bg-secondary py-2 z-10">Selecciona un Entorno:</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 pb-2">
                            {(Object.keys(environments) as EnvironmentType[]).map(env => (
                                <button
                                    key={env}
                                    onClick={() => applyEnvironment(env)}
                                    disabled={!audioBuffer}
                                    className={`p-2 rounded-md text-xs leading-tight font-semibold border transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[4.5rem] text-center relative overflow-hidden group
                                        ${activeEnv === env 
                                            ? 'bg-theme-accent/20 border-theme-accent text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.3)]' 
                                            : 'bg-black/20 border-theme-border text-theme-text-secondary hover:bg-white/5 hover:text-theme-text hover:border-theme-accent-secondary'
                                        } ${!audioBuffer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="relative z-10 group-hover:scale-105 transition-transform">{environments[env].name}</span>
                                    {activeEnv === env && <div className="absolute inset-0 bg-theme-accent/5 animate-pulse z-0"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 text-center bg-black/30 p-3 rounded-lg border border-theme-border/50">
                            <p className="text-theme-text font-medium text-sm">{environments[activeEnv].name}</p>
                            <p className="text-theme-text-secondary text-xs mt-1 italic">
                                {environments[activeEnv].description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcousticsCheckModal;
