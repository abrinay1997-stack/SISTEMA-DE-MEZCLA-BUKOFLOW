
import React, { useState, useRef, useEffect } from 'react';
import { XIcon, ScaleIcon, PlayIcon, TrashIcon, CheckBadgeIcon, SlidersIcon, MagicWandIcon } from './icons';

interface BlindTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FileData = {
    name: string;
    buffer: AudioBuffer | null;
};

type Channel = 'A' | 'B';
type BlindChannel = 'X' | 'Y';

const BlindTestModal: React.FC<BlindTestModalProps> = ({ isOpen, onClose }) => {
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
    const [isDragging, setIsDragging] = useState(false); // New state for seek handling
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Audio Context & Refs ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceARef = useRef<AudioBufferSourceNode | null>(null);
    const sourceBRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeARef = useRef<GainNode | null>(null);
    const gainNodeBRef = useRef<GainNode | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    // --- Initialization ---
    useEffect(() => {
        if (isOpen && !audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            masterGainRef.current = audioCtxRef.current.createGain();
            masterGainRef.current.connect(audioCtxRef.current.destination);
        }
        
        return () => {
             if (!isOpen) {
                stopAudio();
             }
        };
    }, [isOpen]);

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
        }
    }, [isOpen]);


    // --- File Loading ---
    const loadFile = async (e: React.ChangeEvent<HTMLInputElement>, channel: Channel) => {
        const file = e.target.files?.[0];
        if (!file || !audioCtxRef.current) return;
        
        setIsLoading(true);
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
            setError(`Error al cargar el archivo para el canal ${channel}. Asegúrate de que sea un audio válido.`);
        } finally {
            setIsLoading(false);
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

        // 3. Connect: Source -> Gain -> Master
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
        // Don't update time while dragging to avoid fighting the user
        if (!isPlaying || !audioCtxRef.current || isDragging) return;
        
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        setCurrentTime(elapsed % duration);
        animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    // --- Seek Handlers ---
    const handleSeekStart = () => {
        setIsDragging(true);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTime(Number(e.target.value));
    };

    const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        const newTime = Number((e.target as HTMLInputElement).value);
        pauseTimeRef.current = newTime;
        setIsDragging(false);
        
        if (isPlaying) {
            // Restart audio engine at new position
            stopAudio(false); // false = don't overwrite pauseTimeRef with old time
            playAudio();
        }
    };
    
    // Update gains based on Stage, Active Channel, and Setup Levels
    const updateGains = () => {
        if (!audioCtxRef.current || !gainNodeARef.current || !gainNodeBRef.current) return;
        
        const now = audioCtxRef.current.currentTime;
        const rampTime = 0.05; // 50ms crossfade for click-free switching

        let targetGainA = 0;
        let targetGainB = 0;

        if (stage === 'setup') {
            // In setup, activeChannel acts as simple selector for listening
            // Use "X" state to represent "Listen A" and "Y" for "Listen B" for code simplicity
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

    // Effect to update gains whenever relevant state changes
    useEffect(() => {
        if (isPlaying) {
            updateGains();
        }
    }, [activeBlindChannel, gainA, gainB, stage, isPlaying]);


    // --- Auto-Match Logic ---
    const calculateRMS = (buffer: AudioBuffer): number => {
        let sumSquares = 0;
        const numChannels = buffer.numberOfChannels;
        
        // Analyze first 45 seconds to be reasonably fast but accurate
        const maxSamples = Math.min(buffer.length, buffer.sampleRate * 45);
        
        // Skip samples for performance (downsampling)
        const step = 32; 
        
        for (let c = 0; c < numChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < maxSamples; i += step) {
                sumSquares += data[i] * data[i];
            }
        }
        
        const totalSamplesProcessed = (maxSamples / step) * numChannels;
        return Math.sqrt(sumSquares / totalSamplesProcessed);
    };

    const handleAutoMatch = () => {
        if (!fileA.buffer || !fileB.buffer) return;
        
        setIsLoading(true);
        
        // Use setTimeout to allow UI to render loading state
        setTimeout(() => {
            try {
                const rmsA = calculateRMS(fileA.buffer);
                const rmsB = calculateRMS(fileB.buffer);
                
                if (rmsA === 0 || rmsB === 0) {
                    setIsLoading(false);
                    return; 
                }
                
                // Match the louder track down to the quieter track to avoid clipping
                if (rmsA > rmsB) {
                    const ratio = rmsB / rmsA;
                    setGainA(Number(ratio.toFixed(3)));
                    setGainB(1.0);
                } else {
                    const ratio = rmsA / rmsB;
                    setGainA(1.0);
                    setGainB(Number(ratio.toFixed(3)));
                }
            } catch (e) {
                console.error(e);
                setError("Error al analizar el volumen.");
            } finally {
                setIsLoading(false);
            }
        }, 100);
    };


    // --- Workflow Actions ---
    
    const startBlindTest = () => {
        if (!fileA.buffer || !fileB.buffer) return;
        
        // Randomize mapping
        const isRandom = Math.random() > 0.5;
        setMapping(isRandom ? { X: 'A', Y: 'B' } : { X: 'B', Y: 'A' });
        
        setStage('testing');
        setActiveBlindChannel('X'); // Reset to X
        
        // If not playing, user can start manually. If playing, it continues seamless.
        // We just need to trigger updateGains via the useEffect dependency.
    };

    const reveal = () => {
        setStage('revealed');
    };

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
             <div
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-3xl flex flex-col animate-scale-up max-h-[95vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary bg-black/20">
                    <h2 className="text-xl font-bold text-theme-accent flex items-center gap-2">
                        <ScaleIcon className="w-6 h-6" />
                        Comparador A/B Ciego
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {isLoading && <div className="text-center text-theme-accent p-4 bg-black/40 rounded-lg mb-4"><p className="animate-pulse">Analizando audio...</p></div>}
                    {error && <div className="text-center text-red-500 bg-red-500/10 p-2 rounded mb-4 text-sm">{error}</div>}

                    {/* --- STAGE: SETUP --- */}
                    {stage === 'setup' && (
                        <div className="space-y-8 animate-fade-in-step">
                             <p className="text-theme-text-secondary text-sm text-center">
                                Carga dos archivos para comparar. Usa el botón mágico para igualar volúmenes automáticamente (LUFS/RMS).
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* File A Input */}
                                <div className={`p-4 rounded-lg border ${activeBlindChannel === 'X' && isPlaying ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border bg-black/20'}`}>
                                    <h3 className="font-bold text-theme-accent mb-2 flex justify-between">
                                        Archivo A
                                        {fileA.buffer && <button onClick={() => setFileA({name:'', buffer:null})}><TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-500"/></button>}
                                    </h3>
                                    {!fileA.buffer ? (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-theme-border rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                            <span className="text-xs text-theme-text-secondary">Click para cargar</span>
                                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => loadFile(e, 'A')} />
                                        </label>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm truncate font-mono">{fileA.name}</p>
                                            <div className="flex items-center gap-2">
                                                <SlidersIcon className="w-4 h-4 text-theme-text-secondary" />
                                                <input 
                                                    type="range" min="0" max="1.5" step="0.01" 
                                                    value={gainA} 
                                                    onChange={(e) => setGainA(Number(e.target.value))}
                                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-theme-accent"
                                                />
                                            </div>
                                            <p className="text-xs text-right text-theme-text-secondary">{Math.round(gainA * 100)}%</p>
                                            <button 
                                                onClick={() => { setActiveBlindChannel('X'); if(!isPlaying) togglePlay(); }}
                                                className={`w-full py-1 text-xs rounded border ${activeBlindChannel === 'X' ? 'bg-theme-accent text-white border-theme-accent' : 'border-theme-border text-theme-text-secondary'}`}
                                            >
                                                {isPlaying && activeBlindChannel === 'X' ? 'Escuchando...' : 'Escuchar A'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* File B Input */}
                                <div className={`p-4 rounded-lg border ${activeBlindChannel === 'Y' && isPlaying ? 'border-theme-accent-secondary bg-theme-accent-secondary/5' : 'border-theme-border bg-black/20'}`}>
                                    <h3 className="font-bold text-theme-accent-secondary mb-2 flex justify-between">
                                        Archivo B
                                        {fileB.buffer && <button onClick={() => setFileB({name:'', buffer:null})}><TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-500"/></button>}
                                    </h3>
                                    {!fileB.buffer ? (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-theme-border rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                            <span className="text-xs text-theme-text-secondary">Click para cargar</span>
                                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => loadFile(e, 'B')} />
                                        </label>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm truncate font-mono">{fileB.name}</p>
                                            <div className="flex items-center gap-2">
                                                <SlidersIcon className="w-4 h-4 text-theme-text-secondary" />
                                                <input 
                                                    type="range" min="0" max="1.5" step="0.01" 
                                                    value={gainB} 
                                                    onChange={(e) => setGainB(Number(e.target.value))}
                                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-theme-accent-secondary"
                                                />
                                            </div>
                                            <p className="text-xs text-right text-theme-text-secondary">{Math.round(gainB * 100)}%</p>
                                            <button 
                                                onClick={() => { setActiveBlindChannel('Y'); if(!isPlaying) togglePlay(); }}
                                                className={`w-full py-1 text-xs rounded border ${activeBlindChannel === 'Y' ? 'bg-theme-accent-secondary text-white border-theme-accent-secondary' : 'border-theme-border text-theme-text-secondary'}`}
                                            >
                                                 {isPlaying && activeBlindChannel === 'Y' ? 'Escuchando...' : 'Escuchar B'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleAutoMatch}
                                    disabled={!fileA.buffer || !fileB.buffer || isLoading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <MagicWandIcon className="w-4 h-4" />
                                    Auto-Match Nivel
                                </button>
                            </div>

                             {/* Player Controls (Visible for setup too) */}
                            {(fileA.buffer || fileB.buffer) && (
                                <div className="bg-black/40 p-3 rounded-lg flex items-center gap-3">
                                    <button 
                                        onClick={togglePlay}
                                        className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                                    >
                                        {isPlaying ? <div className="flex gap-1"><div className="w-1 h-3 bg-black"></div><div className="w-1 h-3 bg-black"></div></div> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                                    </button>
                                    <span className="text-xs font-mono text-theme-text-secondary w-10">{formatTime(currentTime)}</span>
                                    <input 
                                        type="range" 
                                        min="0" max={duration || 1} 
                                        value={currentTime} 
                                        onChange={handleSeekChange}
                                        onMouseDown={handleSeekStart}
                                        onMouseUp={handleSeekEnd}
                                        onTouchStart={handleSeekStart}
                                        onTouchEnd={handleSeekEnd}
                                        className="flex-grow h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <span className="text-xs font-mono text-theme-text-secondary w-10">{formatTime(duration)}</span>
                                </div>
                            )}

                            <button 
                                onClick={startBlindTest}
                                disabled={!fileA.buffer || !fileB.buffer}
                                className="w-full py-4 bg-gradient-to-r from-theme-accent to-theme-accent-secondary text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Iniciar Test Ciego
                            </button>
                        </div>
                    )}

                    {/* --- STAGE: TESTING / REVEALED --- */}
                    {(stage === 'testing' || stage === 'revealed') && (
                        <div className="space-y-6 animate-fade-in-step flex flex-col h-full">
                             {/* Info Bar */}
                             <div className="flex justify-between items-center text-sm text-theme-text-secondary bg-black/20 px-4 py-2 rounded-full">
                                <span>{stage === 'testing' ? '🎧 Modo Ciego Activado' : '🔓 Resultados Revelados'}</span>
                                <button onClick={handleReset} className="hover:text-red-400 underline">Salir / Reiniciar</button>
                             </div>

                             {/* Switching Controls */}
                             <div className="grid grid-cols-2 gap-4 flex-grow">
                                <button
                                    onClick={() => { setActiveBlindChannel('X'); if(!isPlaying) togglePlay(); }}
                                    className={`relative group h-48 md:h-64 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center gap-4
                                        ${activeBlindChannel === 'X' 
                                            ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]' 
                                            : 'border-gray-700 bg-black/30 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="text-6xl font-bold text-cyan-400">X</div>
                                    {activeBlindChannel === 'X' && isPlaying && <div className="absolute bottom-4 text-cyan-400 text-sm font-bold animate-pulse">REPRODUCIENDO</div>}
                                    
                                    {/* Reveal Info */}
                                    {stage === 'revealed' && (
                                        <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center p-4 text-center animate-pop-in">
                                            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Era el archivo</p>
                                            <p className="text-xl font-bold text-white break-all">{mapping.X === 'A' ? fileA.name : fileB.name}</p>
                                            <div className="mt-2 px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300">
                                                {mapping.X === 'A' ? `Gain: ${Math.round(gainA*100)}%` : `Gain: ${Math.round(gainB*100)}%`}
                                            </div>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => { setActiveBlindChannel('Y'); if(!isPlaying) togglePlay(); }}
                                    className={`relative group h-48 md:h-64 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center gap-4
                                        ${activeBlindChannel === 'Y' 
                                            ? 'border-pink-400 bg-pink-400/10 shadow-[0_0_30px_rgba(244,114,182,0.2)]' 
                                            : 'border-gray-700 bg-black/30 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="text-6xl font-bold text-pink-400">Y</div>
                                    {activeBlindChannel === 'Y' && isPlaying && <div className="absolute bottom-4 text-pink-400 text-sm font-bold animate-pulse">REPRODUCIENDO</div>}
                                     
                                     {/* Reveal Info */}
                                    {stage === 'revealed' && (
                                        <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center p-4 text-center animate-pop-in">
                                            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Era el archivo</p>
                                            <p className="text-xl font-bold text-white break-all">{mapping.Y === 'A' ? fileA.name : fileB.name}</p>
                                             <div className="mt-2 px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300">
                                                {mapping.Y === 'A' ? `Gain: ${Math.round(gainA*100)}%` : `Gain: ${Math.round(gainB*100)}%`}
                                            </div>
                                        </div>
                                    )}
                                </button>
                             </div>

                             {/* Player Bar */}
                             <div className="bg-black/40 p-4 rounded-xl border border-theme-border flex items-center gap-4">
                                    <button 
                                        onClick={togglePlay}
                                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                                    >
                                        {isPlaying ? <div className="flex gap-1"><div className="w-1.5 h-4 bg-black"></div><div className="w-1.5 h-4 bg-black"></div></div> : <PlayIcon className="w-6 h-6 ml-1" />}
                                    </button>
                                    <div className="flex-grow flex flex-col justify-center">
                                        <input 
                                            type="range" 
                                            min="0" max={duration || 1} 
                                            value={currentTime} 
                                            onChange={handleSeekChange}
                                            onMouseDown={handleSeekStart}
                                            onMouseUp={handleSeekEnd}
                                            onTouchStart={handleSeekStart}
                                            onTouchEnd={handleSeekEnd}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                        <div className="flex justify-between text-xs font-mono text-theme-text-secondary mt-1">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                             </div>

                             {/* Voting / Reveal Section */}
                             {stage === 'testing' ? (
                                 <div className="grid grid-cols-3 gap-4">
                                     <button 
                                        onClick={() => setVote('X')}
                                        className={`py-3 rounded-lg font-bold border-2 transition-all ${vote === 'X' ? 'bg-cyan-400 text-black border-cyan-400' : 'border-gray-700 text-gray-400 hover:border-cyan-400 hover:text-cyan-400'}`}
                                     >
                                         Prefiero X
                                     </button>
                                     <button 
                                        onClick={reveal}
                                        disabled={!vote}
                                        className="py-3 rounded-lg font-bold bg-white text-black shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all"
                                     >
                                         Revelar Verdad
                                     </button>
                                     <button 
                                        onClick={() => setVote('Y')}
                                        className={`py-3 rounded-lg font-bold border-2 transition-all ${vote === 'Y' ? 'bg-pink-400 text-black border-pink-400' : 'border-gray-700 text-gray-400 hover:border-pink-400 hover:text-pink-400'}`}
                                     >
                                         Prefiero Y
                                     </button>
                                 </div>
                             ) : (
                                 <div className="text-center p-4 bg-theme-success/10 border border-theme-success rounded-lg animate-pop-in">
                                     <h3 className="text-2xl font-bold text-white mb-2">Tu Elección: {vote}</h3>
                                     <div className="flex items-center justify-center gap-2 text-theme-success">
                                         <CheckBadgeIcon className="w-6 h-6" />
                                         <span className="font-semibold text-lg">
                                             Preferiste: {vote === 'X' ? (mapping.X === 'A' ? fileA.name : fileB.name) : (mapping.Y === 'A' ? fileA.name : fileB.name)}
                                         </span>
                                     </div>
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
