import React, { useState, useRef, useEffect } from 'react';
import { XIcon, ScaleIcon, PlayIcon, TrashIcon, CheckBadgeIcon, SlidersIcon, MagicWandIcon, LoaderIcon, ArrowPathIcon, DownloadIcon } from './icons';
import { HeadphoneCalibrationEngine } from '../utils/audioEngine';
import HeadphoneCorrectionControls from './HeadphoneCorrectionControls';
import { CalibrationState } from '../types';
import AudioWaveform from './AudioWaveform';

interface BlindTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationState: CalibrationState;
  onCalibrationChange: (newState: CalibrationState) => void;
}

type FileData = {
    name: string;
    buffer: AudioBuffer | null;
};

type Channel = 'A' | 'B';
type BlindChannel = 'X' | 'Y';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const BlindTestModal: React.FC<BlindTestModalProps> = ({ isOpen, onClose, calibrationState, onCalibrationChange }) => {
    // --- State ---
    const [stage, setStage] = useState<'setup' | 'testing' | 'revealed'>('setup');
    const [fileA, setFileA] = useState<FileData>({ name: '', buffer: null });
    const [fileB, setFileB] = useState<FileData>({ name: '', buffer: null });
    
    const [gainA, setGainA] = useState(1.0);
    const [gainB, setGainB] = useState(1.0);

    const [mapping, setMapping] = useState<{ X: Channel, Y: Channel }>({ X: 'A', Y: 'B' });
    const [activeBlindChannel, setActiveBlindChannel] = useState<BlindChannel>('X');
    const [vote, setVote] = useState<BlindChannel | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

    // --- Audio Context & Refs ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceARef = useRef<AudioBufferSourceNode | null>(null);
    const sourceBRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeARef = useRef<GainNode | null>(null);
    const gainNodeBRef = useRef<GainNode | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    
    // Calibration Engine
    const calibrationEngineRef = useRef<HeadphoneCalibrationEngine | null>(null);
    
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    // --- Initialization ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (isOpen && !audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            
            // Create Nodes
            masterGainRef.current = audioCtxRef.current.createGain();
            
            // Initialize Calibration
            calibrationEngineRef.current = new HeadphoneCalibrationEngine(audioCtxRef.current);
            
            // Routing: Master Gain -> Calibration Input
            masterGainRef.current.connect(calibrationEngineRef.current.getInputNode());
            
            // Calibration Output -> Destination
            calibrationEngineRef.current.getOutputNode().connect(audioCtxRef.current.destination);
        }
        
        // Sync calibration state
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }
        
        return () => {
             if (!isOpen) {
                stopAudio();
             }
        };
    }, [isOpen, calibrationState]);

    useEffect(() => {
        if (!isOpen) {
            // Reset everything on close
            setStage('setup');
            setFileA({ name: '', buffer: null });
            setFileB({ name: '', buffer: null });
            setVote(null);
            setIsPlaying(false);
            setCurrentTime(0);
            setGainA(1.0);
            setGainB(1.0);
            stopAudio();
            if (calibrationEngineRef.current) {
                calibrationEngineRef.current.dispose();
                calibrationEngineRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
        }
    }, [isOpen]);


    // --- File Loading ---
    const loadFile = async (e: React.ChangeEvent<HTMLInputElement>, channel: Channel) => {
        const file = e.target.files?.[0];
        if (!file || !audioCtxRef.current) return;
        
        // 50MB Limit
        if (file.size > 50 * 1024 * 1024) {
            setError(`El archivo para el canal ${channel} es demasiado grande (>50MB).`);
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Cargando Canal ${channel}...`);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            
            if (channel === 'A') setFileA({ name: file.name, buffer: audioBuffer });
            else setFileB({ name: file.name, buffer: audioBuffer });

            // Set duration based on longest file
            setDuration(prev => Math.max(prev, audioBuffer.duration));
        } catch (err) {
            console.error(err);
            setError(`Error al cargar el archivo para el canal ${channel}.`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };


    // --- Audio Engine ---
    const playAudio = () => {
        if (!audioCtxRef.current || !fileA.buffer || !fileB.buffer) return;
        
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        // 1. Create Source Nodes
        sourceARef.current = audioCtxRef.current.createBufferSource();
        sourceARef.current.buffer = fileA.buffer;
        sourceBRef.current = audioCtxRef.current.createBufferSource();
        sourceBRef.current.buffer = fileB.buffer;
        sourceARef.current.loop = true;
        sourceBRef.current.loop = true;

        // 2. Create Gain Nodes for switching and leveling
        gainNodeARef.current = audioCtxRef.current.createGain();
        gainNodeBRef.current = audioCtxRef.current.createGain();

        // 3. Connect: Source -> Gain -> Master (Master is already routed to Calibration)
        sourceARef.current.connect(gainNodeARef.current);
        gainNodeARef.current.connect(masterGainRef.current!);
        sourceBRef.current.connect(gainNodeBRef.current);
        gainNodeBRef.current.connect(masterGainRef.current!);

        // 4. Start playback at correct offset
        const offset = pauseTimeRef.current % duration; // Ensure offset is within duration
        const now = audioCtxRef.current.currentTime;
        
        sourceARef.current.start(now, offset);
        sourceBRef.current.start(now, offset);
        
        startTimeRef.current = now - offset;
        
        // 5. Apply initial volumes/switching
        updateGains();
        
        setIsPlaying(true);
        requestAnimationFrame(updateTime);
    };

    const stopAudio = (savePosition = true) => {
        if (sourceARef.current) {
            try { sourceARef.current.stop(); } catch(e) {}
            sourceARef.current.disconnect();
            sourceARef.current = null;
        }
        if (sourceBRef.current) {
             try { sourceBRef.current.stop(); } catch(e) {}
            sourceBRef.current.disconnect();
            sourceBRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsPlaying(false);
        
        // Save pause time only if requested (allows seeking to overwrite it manually)
        if (savePosition && audioCtxRef.current) {
             pauseTimeRef.current = (audioCtxRef.current.currentTime - startTimeRef.current) % duration;
        }
    };

    const togglePlay = () => {
        if (isPlaying) stopAudio();
        else playAudio();
    };

    const updateTime = () => {
        if (!isPlaying || !audioCtxRef.current || isDragging) return;
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        setCurrentTime(elapsed % duration);
        animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const handleSeek = (time: number) => {
        pauseTimeRef.current = time;
        setCurrentTime(time);
        if (isPlaying) {
            stopAudio(false); 
            playAudio();
        }
    };
    
    // Update gains based on Stage, Active Channel, and Setup Levels
    const updateGains = () => {
        if (!audioCtxRef.current || !gainNodeARef.current || !gainNodeBRef.current) return;
        
        const now = audioCtxRef.current.currentTime;
        const rampTime = 0.05; // 50ms crossfade

        let targetGainA = 0;
        let targetGainB = 0;

        if (stage === 'setup') {
            // In setup, activeChannel acts as simple selector for listening
            if (activeBlindChannel === 'X') targetGainA = gainA; 
            else targetGainB = gainB;
        } else {
            // In blind/revealed mode, use mapping
            const activeRealChannel = mapping[activeBlindChannel]; // 'A' or 'B'
            if (activeRealChannel === 'A') targetGainA = gainA;
            else targetGainB = gainB;
        }

        gainNodeARef.current.gain.setTargetAtTime(targetGainA, now, rampTime);
        gainNodeBRef.current.gain.setTargetAtTime(targetGainB, now, rampTime);
    };

    useEffect(() => {
        if (isPlaying) {
            updateGains();
        }
    }, [activeBlindChannel, gainA, gainB, stage, isPlaying]);


    // --- Auto-Match Logic (LUFS/K-Weighted) ---
    const calculateIntegratedLUFS = async (buffer: AudioBuffer): Promise<number> => {
        const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
        const offlineCtx = new OfflineCtx(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const filter1 = offlineCtx.createBiquadFilter();
        filter1.type = 'highshelf';
        filter1.frequency.value = 1500;
        filter1.gain.value = 4.0;
        filter1.Q.value = 1.0; 

        const filter2 = offlineCtx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 38; 
        filter2.Q.value = 1.0;

        source.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(offlineCtx.destination);
        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();
        let totalSum = 0;
        let totalSamples = 0;
        const channels = renderedBuffer.numberOfChannels;
        
        for (let c = 0; c < channels; c++) {
            const data = renderedBuffer.getChannelData(c);
            for (let i = 0; i < data.length; i++) {
                const square = data[i] * data[i];
                if (square > 0.0000001) { 
                    totalSum += square;
                    totalSamples++;
                }
            }
        }

        if (totalSamples === 0) return -100;
        const meanSquare = totalSum / totalSamples;
        return -0.691 + 10 * Math.log10(meanSquare + 1e-9);
    };

    const handleAutoMatch = async () => {
        if (!fileA.buffer || !fileB.buffer) return;
        
        setIsLoading(true);
        setLoadingMessage('Analizando LUFS (K-Weighted)...');
        setError(null);
        
        try {
            const [lufsA, lufsB] = await Promise.all([
                calculateIntegratedLUFS(fileA.buffer),
                calculateIntegratedLUFS(fileB.buffer)
            ]);
            
            if (lufsA <= -99 || lufsB <= -99) {
                setError("Audio demasiado silencioso para analizar.");
                setIsLoading(false);
                return;
            }
            
            const targetLUFS = Math.min(lufsA, lufsB);
            const deltaA = targetLUFS - lufsA;
            const deltaB = targetLUFS - lufsB;
            
            const newGainA = Math.pow(10, deltaA / 20);
            const newGainB = Math.pow(10, deltaB / 20);
            
            setGainA(Number(newGainA.toFixed(3)));
            setGainB(Number(newGainB.toFixed(3)));
            
        } catch (e) {
            console.error(e);
            setError("Error al analizar la sonoridad.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };


    // --- Workflow Actions ---
    const startBlindTest = () => {
        if (!fileA.buffer || !fileB.buffer) return;
        const isRandom = Math.random() > 0.5;
        setMapping(isRandom ? { X: 'A', Y: 'B' } : { X: 'B', Y: 'A' });
        setStage('testing');
        setActiveBlindChannel('X');
        // Ensure play starts if not playing
        if (!isPlaying) playAudio();
    };

    const reveal = () => setStage('revealed');

    const handleReset = () => {
        stopAudio();
        setFileA({ name: '', buffer: null });
        setFileB({ name: '', buffer: null });
        setStage('setup');
        setVote(null);
        setGainA(1.0);
        setGainB(1.0);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
    }

    if (!isOpen) return null;

    // Helper to get currently active buffer for visualizer
    const getActiveBuffer = () => {
        if (stage === 'setup') {
            return activeBlindChannel === 'X' ? fileA.buffer : fileB.buffer;
        }
        // In blind mode
        const realChannel = mapping[activeBlindChannel];
        return realChannel === 'A' ? fileA.buffer : fileB.buffer;
    };

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
                    <div className="flex justify-between items-center p-3 bg-[#111]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                                <ScaleIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">BLIND A/B COMPARATOR</span>
                            </h2>
                        </div>
                        
                        {/* Toolbar Controls */}
                        <div className="flex items-center gap-3">
                             <div className="hidden md:flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5 text-xs font-mono text-gray-400">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>

                            <div className="w-px h-4 bg-gray-700 mx-1 hidden sm:block"></div>

                            <button 
                                onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${calibrationState.profile ? 'text-green-400 bg-green-400/10' : 'text-gray-500 hover:text-gray-300'}`}
                                title="Calibración de Auriculares"
                            >
                                <SlidersIcon className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={handleReset} 
                                className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Reset All"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
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

                {/* --- Main Content Area --- */}
                <div className="flex-grow p-4 lg:p-6 flex flex-col gap-6 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
                    
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                            <LoaderIcon className="w-10 h-10 text-theme-accent animate-spin mb-2" />
                            <p className="text-theme-text font-bold animate-pulse">{loadingMessage}</p>
                        </div>
                    )}

                    {error && <div className="w-full text-center text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}

                    {/* --- STAGE: SETUP (The Patchbay) --- */}
                    {stage === 'setup' && (
                        <div className="flex flex-col gap-6 h-full animate-fade-in-step">
                            
                            {/* Dual Channel Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                                {/* Channel A */}
                                <div className={`relative rounded-xl border-2 p-6 flex flex-col gap-4 transition-all ${activeBlindChannel === 'X' ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-800 bg-[#111]'}`}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-cyan-400">TRACK A</h3>
                                        {fileA.buffer && <button onClick={() => setFileA({name:'', buffer:null})} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>

                                    {!fileA.buffer ? (
                                        <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-white/5 hover:border-cyan-500/50 transition-all group">
                                            <DownloadIcon className="w-8 h-8 text-gray-600 group-hover:text-cyan-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-bold">CARGAR ARCHIVO A</span>
                                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => loadFile(e, 'A')} />
                                        </label>
                                    ) : (
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div className="bg-black/40 p-3 rounded border border-white/5 mb-4">
                                                <p className="text-sm text-gray-300 truncate font-mono">{fileA.name}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                                                    <span>Gain</span>
                                                    <span className="text-cyan-400">{(gainA * 100).toFixed(0)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="1.5" step="0.01" 
                                                    value={gainA} 
                                                    onChange={(e) => setGainA(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => { setActiveBlindChannel('X'); if(!isPlaying) togglePlay(); }}
                                                className={`mt-6 w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${activeBlindChannel === 'X' && isPlaying ? 'bg-cyan-500 text-black animate-pulse' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                <PlayIcon className="w-4 h-4" />
                                                {activeBlindChannel === 'X' && isPlaying ? 'REPRODUCIENDO' : 'ESCUCHAR PREVIO'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Channel B */}
                                <div className={`relative rounded-xl border-2 p-6 flex flex-col gap-4 transition-all ${activeBlindChannel === 'Y' ? 'border-orange-500/50 bg-orange-900/10' : 'border-gray-800 bg-[#111]'}`}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-orange-400">TRACK B</h3>
                                        {fileB.buffer && <button onClick={() => setFileB({name:'', buffer:null})} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>

                                    {!fileB.buffer ? (
                                        <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-white/5 hover:border-orange-500/50 transition-all group">
                                            <DownloadIcon className="w-8 h-8 text-gray-600 group-hover:text-orange-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-bold">CARGAR ARCHIVO B</span>
                                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => loadFile(e, 'B')} />
                                        </label>
                                    ) : (
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div className="bg-black/40 p-3 rounded border border-white/5 mb-4">
                                                <p className="text-sm text-gray-300 truncate font-mono">{fileB.name}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                                                    <span>Gain</span>
                                                    <span className="text-orange-400">{(gainB * 100).toFixed(0)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="1.5" step="0.01" 
                                                    value={gainB} 
                                                    onChange={(e) => setGainB(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => { setActiveBlindChannel('Y'); if(!isPlaying) togglePlay(); }}
                                                className={`mt-6 w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${activeBlindChannel === 'Y' && isPlaying ? 'bg-orange-500 text-black animate-pulse' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                <PlayIcon className="w-4 h-4" />
                                                {activeBlindChannel === 'Y' && isPlaying ? 'REPRODUCIENDO' : 'ESCUCHAR PREVIO'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Center Controls */}
                            <div className="flex flex-col items-center gap-4 p-4 bg-[#111] border border-gray-800 rounded-xl">
                                <button
                                    onClick={handleAutoMatch}
                                    disabled={!fileA.buffer || !fileB.buffer || isLoading}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    <MagicWandIcon className="w-5 h-5" />
                                    AUTO LUFS MATCH
                                </button>
                                <p className="text-xs text-gray-500">Iguala la sonoridad percibida (K-Weighted) automáticamente</p>
                                
                                <div className="w-full h-px bg-gray-800 my-2"></div>
                                
                                <button 
                                    onClick={startBlindTest}
                                    disabled={!fileA.buffer || !fileB.buffer}
                                    className="w-full max-w-md py-4 bg-theme-accent text-white font-bold text-lg tracking-widest rounded-lg shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.4)] hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    INICIAR TEST CIEGO
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- STAGE: TESTING / REVEALED (The Console) --- */}
                    {(stage === 'testing' || stage === 'revealed') && (
                        <div className="flex flex-col gap-6 h-full animate-fade-in-step">
                            
                            {/* 1. The Monitor Screen */}
                            <div className="relative w-full bg-[#080808] rounded-xl border border-gray-800 overflow-hidden shadow-inner min-h-[200px] flex flex-col justify-center items-center group">
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                                    <span className="text-xs font-mono text-gray-400">{isPlaying ? 'LIVE' : 'PAUSED'}</span>
                                </div>
                                
                                {stage === 'revealed' && (
                                    <div className="absolute top-4 right-4 z-10 bg-theme-success/20 border border-theme-success text-theme-success px-3 py-1 rounded font-bold text-xs animate-pop-in">
                                        RESULTADOS REVELADOS
                                    </div>
                                )}

                                <div className="w-full h-full opacity-80">
                                    <AudioWaveform 
                                        buffer={getActiveBuffer()}
                                        progress={currentTime}
                                        onSeek={handleSeek}
                                        height={200}
                                        color="#1e293b"
                                        progressColor="#38bdf8" // Neutral Blue for blind test
                                    />
                                </div>
                            </div>

                            {/* 2. The Control Deck (Pads) */}
                            <div className="grid grid-cols-2 gap-4 md:gap-8 flex-grow">
                                {/* Pad X */}
                                <button
                                    onClick={() => { setActiveBlindChannel('X'); if(!isPlaying) togglePlay(); }}
                                    className={`
                                        relative rounded-2xl border-4 transition-all duration-100 active:scale-95 flex flex-col items-center justify-center gap-4 group
                                        ${activeBlindChannel === 'X' 
                                            ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.3)]' 
                                            : 'border-gray-800 bg-[#111] hover:border-gray-600'
                                        }
                                    `}
                                >
                                    <span className={`text-6xl font-black ${activeBlindChannel === 'X' ? 'text-cyan-400' : 'text-gray-700 group-hover:text-gray-500'}`}>X</span>
                                    {activeBlindChannel === 'X' && <span className="text-xs font-bold text-cyan-400 tracking-widest bg-black/50 px-3 py-1 rounded">ACTIVE</span>}
                                    
                                    {stage === 'revealed' && (
                                        <div className="absolute inset-0 bg-black/90 rounded-xl flex flex-col items-center justify-center p-4 text-center animate-pop-in z-20 border-2 border-cyan-500/50">
                                            <p className="text-gray-500 text-xs uppercase font-bold mb-2">ARCHIVO REAL</p>
                                            <p className="text-xl font-bold text-white break-all px-2">{mapping.X === 'A' ? fileA.name : fileB.name}</p>
                                            <div className="mt-3 inline-block px-3 py-1 rounded bg-gray-800 text-xs text-gray-300 border border-gray-700">
                                                {mapping.X === 'A' ? 'TRACK A' : 'TRACK B'}
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {/* Pad Y */}
                                <button
                                    onClick={() => { setActiveBlindChannel('Y'); if(!isPlaying) togglePlay(); }}
                                    className={`
                                        relative rounded-2xl border-4 transition-all duration-100 active:scale-95 flex flex-col items-center justify-center gap-4 group
                                        ${activeBlindChannel === 'Y' 
                                            ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.3)]' 
                                            : 'border-gray-800 bg-[#111] hover:border-gray-600'
                                        }
                                    `}
                                >
                                    <span className={`text-6xl font-black ${activeBlindChannel === 'Y' ? 'text-orange-400' : 'text-gray-700 group-hover:text-gray-500'}`}>Y</span>
                                    {activeBlindChannel === 'Y' && <span className="text-xs font-bold text-orange-400 tracking-widest bg-black/50 px-3 py-1 rounded">ACTIVE</span>}

                                    {stage === 'revealed' && (
                                        <div className="absolute inset-0 bg-black/90 rounded-xl flex flex-col items-center justify-center p-4 text-center animate-pop-in z-20 border-2 border-orange-500/50">
                                            <p className="text-gray-500 text-xs uppercase font-bold mb-2">ARCHIVO REAL</p>
                                            <p className="text-xl font-bold text-white break-all px-2">{mapping.Y === 'A' ? fileA.name : fileB.name}</p>
                                            <div className="mt-3 inline-block px-3 py-1 rounded bg-gray-800 text-xs text-gray-300 border border-gray-700">
                                                {mapping.Y === 'A' ? 'TRACK A' : 'TRACK B'}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* 3. Action Bar */}
                            {stage === 'testing' ? (
                                <div className="bg-[#111] border-t border-gray-800 p-4 -mx-4 -mb-4 lg:rounded-xl lg:mx-0 lg:mb-0 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex-grow flex gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={() => setVote('X')}
                                            className={`flex-1 py-4 rounded-lg font-bold border-2 transition-all ${vote === 'X' ? 'bg-cyan-500 text-black border-cyan-500' : 'border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-500'}`}
                                        >
                                            VOTO X
                                        </button>
                                        <button 
                                            onClick={() => setVote('Y')}
                                            className={`flex-1 py-4 rounded-lg font-bold border-2 transition-all ${vote === 'Y' ? 'bg-orange-500 text-black border-orange-500' : 'border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}
                                        >
                                            VOTO Y
                                        </button>
                                    </div>
                                    <button 
                                        onClick={reveal}
                                        disabled={!vote}
                                        className="w-full sm:w-auto px-8 py-4 rounded-lg font-bold bg-white text-black shadow-lg hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all uppercase tracking-widest"
                                    >
                                        REVELAR
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#111] border border-theme-success/30 p-6 rounded-xl flex flex-col items-center justify-center gap-3 animate-pop-in">
                                    <CheckBadgeIcon className="w-12 h-12 text-theme-success" />
                                    <h3 className="text-2xl font-bold text-white">Elección: {vote}</h3>
                                    <p className="text-theme-text-secondary">
                                        Preferiste: <span className="text-white font-bold">{vote === 'X' ? (mapping.X === 'A' ? 'TRACK A' : 'TRACK B') : (mapping.Y === 'A' ? 'TRACK A' : 'TRACK B')}</span>
                                    </p>
                                    <button onClick={handleReset} className="mt-2 text-sm text-gray-500 underline hover:text-white">Reiniciar Test</button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlindTestModal;