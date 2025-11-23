
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, ChartBarIcon, PlayIcon, SpeakerWaveIcon, EyeIcon, ArrowPathIcon, StarFilledIcon, DownloadIcon } from './icons';
import { HeadphoneCalibrationEngine } from '../utils/audioEngine';
import HeadphoneCorrectionControls from './HeadphoneCorrectionControls';
import { CalibrationState } from '../types';
import AudioWaveform from './AudioWaveform';

interface ReferenceTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationState: CalibrationState;
  onCalibrationChange: (newState: CalibrationState) => void;
}

interface GenreProfile {
  id: string;
  name: string;
  description: string;
  // Normalized points relative to a baseline
  // [Sub(40Hz), Bass(100Hz), LowMid(300Hz), Mid(1k), HighMid(3k), Presence(8k), Air(15k)]
  curve: number[];
}

const genres: GenreProfile[] = [
  { 
    id: 'balanced', 
    name: 'Referencia Plana (Pink Noise)', 
    description: 'El estándar de ingeniería. Una referencia de equilibrio tonal general.',
    curve: [0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4] 
  },
  { 
    id: 'trap_cinematic', 
    name: 'Beat Trap Cinematic', 
    description: 'Curva oscura y profunda. Sub-graves extremos (+45dB) y caída dramática en agudos (>12kHz) para atmósfera pesada.',
    curve: [0.95, 0.82, 0.72, 0.60, 0.50, 0.42, 0.25] 
  },
  { 
    id: 'urban', 
    name: 'Reggaeton / Urbano', 
    description: 'Curva precisa Top Chart. Sub-grave profundo (+39dB pico), medios claros y roll-off suave en agudos.',
    curve: [0.88, 0.80, 0.75, 0.62, 0.53, 0.44, 0.20] 
  },
  { 
    id: 'modern_rap', 
    name: 'Rap Moderno', 
    description: 'Grave dominante (+41dB), medios claros para voz y agudos controlados/oscuros.',
    curve: [0.91, 0.85, 0.76, 0.67, 0.53, 0.44, 0.22] 
  },
  { 
    id: 'hiphop', 
    name: 'Hip Hop / Trap Moderno', 
    description: 'Sub-graves masivos (808s) dominantes, medios levemente socavados y agudos nítidos.',
    curve: [0.9, 0.8, 0.5, 0.45, 0.5, 0.6, 0.6] 
  },
  { 
    id: 'pop', 
    name: 'Pop Mainstream', 
    description: 'Curva "Sonrisa" moderna. Graves sólidos, medios claros y un brillo "Air" pulido.',
    curve: [0.75, 0.7, 0.55, 0.55, 0.6, 0.65, 0.6] 
  },
  { 
    id: 'edm', 
    name: 'EDM / House / Techno', 
    description: 'Pared de sonido. Energía constante y muy comprimida en todo el espectro.',
    curve: [0.85, 0.8, 0.65, 0.6, 0.65, 0.7, 0.65] 
  },
  { 
    id: 'rock', 
    name: 'Rock / Metal', 
    description: 'Enfoque en medios-graves y medios-agudos (Guitarras). Menos sub-grave profundo.',
    curve: [0.6, 0.7, 0.7, 0.75, 0.7, 0.6, 0.45] 
  },
  { 
    id: 'salsa', 
    name: 'Salsa / Merengue / Tropical', 
    description: 'Graves percusivos (no Sub), Medios-Agudos muy prominentes (Metales, Piano).',
    curve: [0.5, 0.75, 0.65, 0.7, 0.8, 0.75, 0.5] 
  },
  { 
    id: 'afrobeats', 
    name: 'Afrobeats / Dancehall', 
    description: 'Cálido y profundo. Sub-grave suave, medios cálidos, agudos suaves.',
    curve: [0.8, 0.75, 0.65, 0.6, 0.5, 0.45, 0.4] 
  },
  { 
    id: 'cinematic', 
    name: 'Cinemático / Trailer', 
    description: 'Curva descendente dramática. Sub-graves tectónicos para impacto.',
    curve: [0.95, 0.85, 0.6, 0.5, 0.4, 0.45, 0.5] 
  },
  { 
    id: 'symphonic', 
    name: 'Orquestal / Sinfónico', 
    description: 'Dinámica natural. Riqueza en graves-medios (Cellos/Contrabajos).',
    curve: [0.6, 0.65, 0.7, 0.6, 0.5, 0.4, 0.3] 
  },
  { 
    id: 'jazz', 
    name: 'Jazz / Acústico', 
    description: 'Lo más natural posible. Medios orgánicos, caída natural en agudos.',
    curve: [0.5, 0.6, 0.65, 0.6, 0.5, 0.4, 0.3] 
  }
];

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ReferenceTracksModal: React.FC<ReferenceTracksModalProps> = ({ isOpen, onClose, calibrationState, onCalibrationChange }) => {
  const [selectedGenreId, setSelectedGenreId] = useState<string>('balanced');
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Playback State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Controls
  const [visualGain, setVisualGain] = useState<number>(0.8); 
  const [smoothing, setSmoothing] = useState<number>(0.96); 
  const [showPeakHold, setShowPeakHold] = useState(true);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Sync Ref
  const isPlayingRef = useRef(false);
  
  // Calibration Engine
  const calibrationEngineRef = useRef<HeadphoneCalibrationEngine | null>(null);
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Peak Data Ref
  const peakDataRef = useRef<Float32Array | null>(null);

  const selectedGenre = genres.find(g => g.id === selectedGenreId) || genres[0];

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

  // Setup Audio Context & Calibration - ONLY on open
  useEffect(() => {
    if (isOpen && !audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 4096; 
        analyserRef.current.smoothingTimeConstant = smoothing;
        analyserRef.current.minDecibels = -100;
        analyserRef.current.maxDecibels = -30;
        
        // Initialize Calibration
        calibrationEngineRef.current = new HeadphoneCalibrationEngine(audioContextRef.current);

        audioElementRef.current = new Audio();
        audioElementRef.current.crossOrigin = "anonymous";
        audioElementRef.current.loop = true;
        
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
        
        // Routing: Source -> Analyser (Raw Viz) -> Calibration -> Output (Flat Audio)
        sourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(calibrationEngineRef.current.getInputNode());
        calibrationEngineRef.current.getOutputNode().connect(audioContextRef.current.destination);
        
        // Apply initial calibration state
        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.loadProfile(calibrationState.profile);
            calibrationEngineRef.current.setAmount(calibrationState.amount);
            calibrationEngineRef.current.setBypass(calibrationState.bypass);
        }

        startVisualizer();
    }

    return () => {
        // Cleanup on close or unmount
        stopVisualizer();
        
        // CRITICAL: Stop audio and cleanup source
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.src = "";
            audioElementRef.current.load();
            audioElementRef.current = null;
        }
        
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }

        if (calibrationEngineRef.current) {
            calibrationEngineRef.current.dispose();
            calibrationEngineRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (e) {
                console.warn("Error closing AudioContext", e);
            }
            audioContextRef.current = null;
        }
        
        setIsPlaying(false);
        isPlayingRef.current = false;
        setFileName(null);
        setAudioBuffer(null);
        peakDataRef.current = null;
    }
  }, [isOpen]);

  // Separate effect for Calibration Updates
  useEffect(() => {
    if (calibrationEngineRef.current) {
        calibrationEngineRef.current.loadProfile(calibrationState.profile);
        calibrationEngineRef.current.setAmount(calibrationState.amount);
        calibrationEngineRef.current.setBypass(calibrationState.bypass);
    }
  }, [calibrationState]);

  // Update smoothing in real-time
  useEffect(() => {
    if (analyserRef.current) {
        analyserRef.current.smoothingTimeConstant = smoothing;
    }
  }, [smoothing]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !audioElementRef.current || !audioContextRef.current) return;
      
      // 50MB Limit
      if (file.size > 50 * 1024 * 1024) {
          setError("El archivo es demasiado grande (>50MB).");
          return;
      }
      
      setError(null);
      const url = URL.createObjectURL(file);
      audioElementRef.current.src = url;
      setFileName(file.name);
      
      // Decode buffer for visual waveform
      try {
          const arrayBuffer = await file.arrayBuffer();
          const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer);
          setAudioBuffer(decoded);
          setDuration(decoded.duration);
      } catch(e) {
          console.error("Error decoding for waveform", e);
      }

      if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
      }
  };

  const togglePlay = () => {
      if (!audioElementRef.current || !fileName) return;
      
      if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
      }

      if (isPlaying) {
          audioElementRef.current.pause();
          isPlayingRef.current = false;
      } else {
          audioElementRef.current.play();
          isPlayingRef.current = true;
      }
      setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (time: number) => {
      if (audioElementRef.current) {
          audioElementRef.current.currentTime = time;
          setCurrentTime(time);
      }
  };
  
  const stopVisualizer = () => {
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }
  };
  
  const clearPeaks = () => {
    if (peakDataRef.current) {
        peakDataRef.current.fill(0);
    }
  };

  const startVisualizer = () => {
      const draw = () => {
          // --- SYNC WAVEFORM PROGRESS IN LOOP ---
          if (isPlayingRef.current && audioElementRef.current) {
              setCurrentTime(audioElementRef.current.currentTime);
          }

          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const width = canvas.width;
          const height = canvas.height;
          
          // Clear
          ctx.clearRect(0, 0, width, height);

          // --- 1. Draw Grid (Logarithmic Scale) ---
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          
          const minLog = Math.log10(20);
          const maxLog = Math.log10(20000);
          const scale = width / (maxLog - minLog);

          const getX = (freq: number) => {
              return (Math.log10(freq) - minLog) * scale;
          };

          const freqs = [40, 100, 250, 1000, 4000, 10000];
          const labels = ['40', '100', '250', '1k', '4k', '10k'];

          freqs.forEach((freq, i) => {
              const x = getX(freq);
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.fillStyle = 'rgba(255,255,255,0.6)';
              ctx.font = '11px "Exo 2", sans-serif';
              ctx.fillText(labels[i], x + 4, height - 6);
          });
          ctx.stroke();

          // Draw baseline (0dB equivalent visually)
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();


          // --- 2. Draw Reference Curve (The Ghost) ---
          const targetFreqs = [40, 100, 300, 1000, 3000, 8000, 15000];
          const curveXPositions = targetFreqs.map(f => getX(f));
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Target color
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          
          const currentCurve = activeCurveRef.current;
          
          if (currentCurve) {
              const points = curveXPositions.map((x, i) => ({
                  x: x,
                  y: height - (currentCurve[i] * height * 0.8) - (height * 0.1) 
              }));

              ctx.moveTo(points[0].x, points[0].y);
              for (let i = 0; i < points.length - 1; i++) {
                  const xc = (points[i].x + points[i + 1].x) / 2;
                  const yc = (points[i].y + points[i + 1].y) / 2;
                  ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
              }
              ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          }
          ctx.stroke();
          ctx.setLineDash([]);


          // --- 3. Draw Real-Time Audio (Raw - No Tilt) ---
          if (analyserRef.current && isPlayingRef.current && audioContextRef.current) {
              const bufferLength = analyserRef.current.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              analyserRef.current.getByteFrequencyData(dataArray);
              const sampleRate = audioContextRef.current.sampleRate;

              // Initialize Peak Data Buffer if needed
              if (!peakDataRef.current || peakDataRef.current.length !== bufferLength) {
                  peakDataRef.current = new Float32Array(bufferLength);
              }

              // Calculate Data for Peak Storage
              for (let i = 0; i < bufferLength; i++) {
                 if (dataArray[i] > peakDataRef.current[i]) {
                     peakDataRef.current[i] = dataArray[i];
                 }
              }

              // --- Draw Filled Spectrum ---
              ctx.beginPath();
              ctx.strokeStyle = '#0ea5e9'; // Sky Blue (Theme Accent)
              ctx.lineWidth = 2;
              ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
              ctx.moveTo(0, height);
              
              for (let x = 0; x < width; x += 2) {
                  const freq = Math.pow(10, (x / scale) + minLog);
                  const binIndex = Math.floor(freq * (bufferLength * 2) / sampleRate);
                  if (binIndex >= bufferLength) break;

                  const rawValue = dataArray[binIndex] / 255; // 0.0 to 1.0
                  
                  // Apply Visual Gain ONLY (No Tilt)
                  let finalValue = rawValue * visualGainRef.current;
                  
                  // Clamp
                  finalValue = Math.min(Math.max(finalValue, 0), 1);
                  
                  const y = height - (finalValue * height);
                  ctx.lineTo(x, y);
              }
              ctx.lineTo(width, height); 
              ctx.fill();
              ctx.stroke();

              // --- Draw Peak Hold Line ---
              if (showPeakHoldRef.current && peakDataRef.current) {
                  ctx.beginPath();
                  ctx.strokeStyle = 'rgba(14, 255, 255, 0.8)'; // Cyan/Bright
                  ctx.lineWidth = 1;

                  let started = false;

                  for (let x = 0; x < width; x += 2) {
                      const freq = Math.pow(10, (x / scale) + minLog);
                      const binIndex = Math.floor(freq * (bufferLength * 2) / sampleRate);
                      if (binIndex >= bufferLength) break;

                      // Retrieve Peak Value
                      const rawPeak = peakDataRef.current[binIndex] / 255;

                      let finalPeak = rawPeak * visualGainRef.current;
                      finalPeak = Math.min(Math.max(finalPeak, 0), 1);

                      const yPeak = height - (finalPeak * height);

                      if (!started) {
                          ctx.moveTo(x, yPeak);
                          started = true;
                      } else {
                          ctx.lineTo(x, yPeak);
                      }
                  }
                  ctx.stroke();
              }
          }

          animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
  };

  // Refs for animation loop
  const activeCurveRef = useRef(selectedGenre.curve);
  const visualGainRef = useRef(visualGain);
  const showPeakHoldRef = useRef(showPeakHold);

  useEffect(() => {
      activeCurveRef.current = selectedGenre.curve;
  }, [selectedGenre]);
  
  useEffect(() => {
      visualGainRef.current = visualGain;
  }, [visualGain]);
  
  useEffect(() => {
      showPeakHoldRef.current = showPeakHold;
  }, [showPeakHold]);
  
  // Display Logic for Smoothing Time
  const getSmoothingLabel = (val: number) => {
      if (val <= 0.93) return "Rápido (~1s)";
      if (val >= 0.99) return "Lento (~6s)";
      return "Promedio (~3s)";
  };


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-5xl flex flex-col animate-scale-up max-h-[95vh] overflow-hidden pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary bg-black/20">
            <h2 className="text-xl font-bold text-theme-accent flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6" />
                Spectrum Target (Raw)
            </h2>
            <button onClick={onClose} className="p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
            
            {/* Headphone Correction Module */}
            <HeadphoneCorrectionControls 
                calibrationState={calibrationState}
                onCalibrationChange={onCalibrationChange}
            />

            {/* The Spectrum Canvas */}
            <div className="relative w-full h-48 md:h-80 bg-black rounded-lg border border-theme-border overflow-hidden shadow-inner mb-4">
                <canvas ref={canvasRef} width={1024} height={320} className="w-full h-full" />
                
                {/* Labels Overlay */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded border border-white/10 pointer-events-none">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Target Curve</p>
                    <p className="text-sm font-bold text-white">{selectedGenre.name}</p>
                </div>
            </div>

            {/* Controls: Genre & File */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Genre Selector */}
                <div className="md:col-span-1 flex flex-col gap-2">
                    <label className="text-xs font-bold text-theme-accent-secondary uppercase">1. Selecciona Género (Target)</label>
                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-2 rounded-lg border border-theme-border">
                        {genres.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGenreId(g.id)}
                                className={`text-left px-3 py-2 rounded-md text-sm transition-all border flex justify-between items-center ${selectedGenreId === g.id ? 'bg-theme-accent/20 border-theme-accent text-white font-semibold' : 'border-transparent hover:bg-white/5 text-theme-text-secondary'}`}
                            >
                                <span className="flex items-center gap-2">
                                    {g.name}
                                    {(g.id === 'trap_cinematic' || g.id === 'urban' || g.id === 'modern_rap') && <StarFilledIcon className="w-3 h-3 text-theme-priority" />}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player & Viz Controls */}
                <div className="md:col-span-2 flex flex-col gap-4">
                     <label className="text-xs font-bold text-theme-accent-secondary uppercase">2. Carga tu Mezcla y Ajusta</label>
                     
                     {!fileName ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-theme-border rounded-lg cursor-pointer bg-black/20 hover:bg-white/5 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-theme-accent/5 group-hover:bg-theme-accent/10 transition-colors"></div>
                            <div className="flex flex-col items-center justify-center relative z-10">
                                <DownloadIcon className="w-10 h-10 text-theme-accent mb-2 animate-bounce" />
                                <p className="text-base text-theme-text font-bold">Arrastra o Click para cargar Audio</p>
                                <p className="text-xs text-theme-text-secondary mt-1">Soporta MP3/WAV (Max 50MB)</p>
                            </div>
                            <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                        </label>
                     ) : (
                        <div className="flex flex-col gap-2 bg-black/30 p-4 rounded-lg border border-theme-border">
                             <div className="flex items-center gap-3">
                                 <button 
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-theme-accent text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-theme-accent/20"
                                 >
                                    {isPlaying ? <div className="flex gap-1"><div className="w-1.5 h-4 bg-white"></div><div className="w-1.5 h-4 bg-white"></div></div> : <PlayIcon className="w-6 h-6 ml-0.5" />}
                                 </button>
                                 <div className="flex-grow truncate">
                                     <div className="flex justify-between items-end mb-1">
                                        <p className="text-base font-bold truncate text-theme-text">{fileName}</p>
                                        <p className="text-xs font-mono text-theme-text-secondary">{formatTime(currentTime)} / {formatTime(duration)}</p>
                                     </div>
                                     
                                     {/* Waveform Component Integration */}
                                     <div className="h-12 bg-black/50 rounded border border-theme-border overflow-hidden">
                                         {audioBuffer && (
                                             <AudioWaveform 
                                                buffer={audioBuffer}
                                                progress={currentTime}
                                                onSeek={handleSeek}
                                                height={48}
                                                color="#334155"
                                                progressColor="#0ea5e9"
                                             />
                                         )}
                                     </div>
                                 </div>
                             </div>
                             <div className="flex justify-end">
                                <button onClick={() => { setFileName(null); setIsPlaying(false); isPlayingRef.current = false; audioElementRef.current?.pause(); }} className="text-xs text-red-400 hover:text-red-300 underline">Cambiar Archivo</button>
                             </div>
                        </div>
                     )}
                     {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

                     {/* Sliders Grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg border border-theme-border/50">
                         {/* Visual Gain Slider */}
                         <div>
                            <div className="flex justify-between text-xs text-theme-text-secondary mb-2">
                                <span>Input Gain (Visual)</span>
                                <span className="text-theme-accent font-mono">{Math.round(visualGain * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0.7" max="1.1" step="0.01"
                                value={visualGain}
                                onChange={(e) => setVisualGain(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-theme-accent"
                            />
                         </div>
                         
                         {/* Smoothing Slider */}
                         <div>
                            <div className="flex justify-between text-xs text-theme-text-secondary mb-2">
                                <span>Velocidad (Integración)</span>
                                <span className={`font-mono ${smoothing > 0.95 ? 'text-theme-success' : 'text-theme-priority'}`}>
                                    {getSmoothingLabel(smoothing)}
                                </span>
                            </div>
                            <input 
                                type="range" min="0.92" max="0.999" step="0.001"
                                value={smoothing}
                                onChange={(e) => setSmoothing(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-theme-success"
                                title="Izquierda: Rápido (1s) | Derecha: Lento (6s)"
                            />
                         </div>
                     </div>
                     
                     {/* Peak Hold Controls */}
                     <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setShowPeakHold(!showPeakHold)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${showPeakHold ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-black/20 text-gray-500 border-gray-700'}`}
                        >
                            <EyeIcon className="w-4 h-4" />
                            Peak Hold: {showPeakHold ? 'ON' : 'OFF'}
                        </button>
                        <button 
                            onClick={clearPeaks}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Clear Mem
                        </button>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceTracksModal;
