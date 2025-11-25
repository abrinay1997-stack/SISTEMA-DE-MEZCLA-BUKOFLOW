import React, { useState, useEffect, useRef } from 'react';
import { XIcon, ChartBarIcon, PlayIcon, SpeakerWaveIcon, EyeIcon, ArrowPathIcon, StarFilledIcon, DownloadIcon, CheckCircleIcon, SlidersIcon, LoaderIcon } from './icons';
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
    id: 'acapella_rap', 
    name: 'Acapella de Rap', 
    description: 'Voz solista aislada. Pico fundamental en 250Hz, valle en 4.7kHz.',
    curve: [0.65, 0.90, 0.90, 0.78, 0.62, 0.55, 0.30] 
  },
  { 
    id: 'trap_cinematic', 
    name: 'Beat Trap Cinematic', 
    description: 'Sub-graves extremos (+45dB) y caída dramática en agudos.',
    curve: [0.95, 0.82, 0.72, 0.60, 0.50, 0.42, 0.25] 
  },
  { 
    id: 'urban', 
    name: 'Reggaeton / Urbano', 
    description: 'Sub-grave profundo (+39dB pico), medios claros.',
    curve: [0.88, 0.80, 0.75, 0.62, 0.53, 0.44, 0.20] 
  },
  { 
    id: 'modern_rap', 
    name: 'Rap Moderno', 
    description: 'Grave dominante, medios claros para voz y agudos controlados.',
    curve: [0.91, 0.85, 0.76, 0.67, 0.53, 0.44, 0.22] 
  },
  { 
    id: 'hiphop', 
    name: 'Hip Hop / Trap Moderno', 
    description: 'Sub-graves masivos (808s) dominantes, agudos nítidos.',
    curve: [0.9, 0.8, 0.5, 0.45, 0.5, 0.6, 0.6] 
  },
  { 
    id: 'pop', 
    name: 'Pop Mainstream', 
    description: 'Curva "Sonrisa" moderna. Graves sólidos, brillo "Air" pulido.',
    curve: [0.75, 0.7, 0.55, 0.55, 0.6, 0.65, 0.6] 
  },
  { 
    id: 'edm', 
    name: 'EDM / House / Techno', 
    description: 'Pared de sonido. Energía constante y muy comprimida.',
    curve: [0.85, 0.8, 0.65, 0.6, 0.65, 0.7, 0.65] 
  },
  { 
    id: 'rock', 
    name: 'Rock / Metal', 
    description: 'Enfoque en medios-graves y medios-agudos (Guitarras).',
    curve: [0.6, 0.7, 0.7, 0.75, 0.7, 0.6, 0.45] 
  },
  { 
    id: 'salsa', 
    name: 'Salsa / Merengue / Tropical', 
    description: 'Graves percusivos, Medios-Agudos muy prominentes.',
    curve: [0.5, 0.75, 0.65, 0.7, 0.8, 0.75, 0.5] 
  },
  { 
    id: 'afrobeats', 
    name: 'Afrobeats / Dancehall', 
    description: 'Cálido y profundo. Sub-grave suave, medios cálidos.',
    curve: [0.8, 0.75, 0.65, 0.6, 0.5, 0.45, 0.4] 
  },
  { 
    id: 'cinematic', 
    name: 'Cinemático / Trailer', 
    description: 'Curva descendente dramática. Sub-graves tectónicos.',
    curve: [0.95, 0.85, 0.6, 0.5, 0.4, 0.45, 0.5] 
  },
  { 
    id: 'symphonic', 
    name: 'Orquestal / Sinfónico', 
    description: 'Dinámica natural. Riqueza en graves-medios.',
    curve: [0.6, 0.65, 0.7, 0.6, 0.5, 0.4, 0.3] 
  },
  { 
    id: 'jazz', 
    name: 'Jazz / Acústico', 
    description: 'Lo más natural posible. Medios orgánicos.',
    curve: [0.5, 0.6, 0.65, 0.6, 0.5, 0.4, 0.3] 
  }
];

interface AnalysisResult {
    band: string;
    range: string;
    status: 'ok' | 'warning' | 'critical';
    diff: number; // Positive = too loud, Negative = too quiet
    message: string;
}

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
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Playback State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Controls
  const [visualGain, setVisualGain] = useState<number>(0.8); 
  const [smoothing, setSmoothing] = useState<number>(0.96); 
  
  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([]);

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
  const analysisIntervalRef = useRef<number | null>(null);
  
  // Data Refs (Persistent across renders)
  const peakDataRef = useRef<Float32Array | null>(null);
  
  // Mouse Interaction Ref
  const mousePosRef = useRef<{x: number, y: number} | null>(null);

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
        
        // Start Analysis Loop (Throttle to 500ms)
        analysisIntervalRef.current = window.setInterval(runAnalysis, 500);
    }

    return () => {
        // Cleanup on close or unmount
        stopVisualizer();
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
        
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
        mousePosRef.current = null;
        setAnalysis([]);
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
  
  // Function to reset file state without destroying the context
  const handleResetFile = () => {
      if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
      setFileName(null);
      setAudioBuffer(null);
      setAnalysis([]);
      clearPeaks();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !audioElementRef.current || !audioContextRef.current) return;
      
      // 50MB Limit
      if (file.size > 50 * 1024 * 1024) {
          setError("El archivo es demasiado grande (>50MB).");
          return;
      }
      
      setIsLoading(true);
      setError(null);
      handleResetFile();

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
      } finally {
          setIsLoading(false);
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

  // Mouse Events for Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Normalize to canvas internal resolution
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      mousePosRef.current = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
      };
  };

  const handleCanvasMouseLeave = () => {
      mousePosRef.current = null;
  };

  // --- Analysis Logic (Diagnostics) ---
  const getFreqIndex = (freq: number, sampleRate: number, bufferLength: number) => {
      return Math.floor(freq * (bufferLength * 2) / sampleRate);
  };

  const calculateBandAverage = (data: Float32Array, startFreq: number, endFreq: number, sampleRate: number) => {
      const startBin = getFreqIndex(startFreq, sampleRate, data.length);
      const endBin = getFreqIndex(endFreq, sampleRate, data.length);
      let sum = 0;
      let count = 0;
      
      for (let i = startBin; i <= endBin && i < data.length; i++) {
          sum += data[i] / 255; // Normalize to 0-1
          count++;
      }
      return count > 0 ? sum / count : 0;
  };

  const runAnalysis = () => {
      if (!isPlayingRef.current || !peakDataRef.current || !audioContextRef.current) {
          if (analysis.length > 0 && !isPlayingRef.current) setAnalysis([]);
          return;
      }

      const peakData = peakDataRef.current;
      const sampleRate = audioContextRef.current.sampleRate;
      const curve = activeCurveRef.current; // [Sub, Bass, LowMid, Mid, HighMid, Presence, Air]

      // 1. Define Bands (Updated mapping)
      const bands = [
          { label: 'Sub', range: '40-100Hz', start: 40, end: 100, targetVal: curve[0] },
          { label: 'Bass', range: '100-300Hz', start: 100, end: 300, targetVal: curve[1] },
          { label: 'LowMid', range: '300-1k', start: 300, end: 1000, targetVal: curve[2] },
          { label: 'Mid', range: '1k-3k', start: 1000, end: 3000, targetVal: curve[3] },
          { label: 'HighMid', range: '3k-8k', start: 3000, end: 8000, targetVal: curve[4] },
          { label: 'Presence', range: '8k-15k', start: 8000, end: 15000, targetVal: curve[5] },
          { label: 'Air', range: '15k+', start: 15000, end: 20000, targetVal: curve[6] }
      ];

      // 2. Calculate Averages
      const userLevels = bands.map(b => calculateBandAverage(peakData, b.start, b.end, sampleRate));

      // 3. Check silence (Index 2+3 average for mid energy check)
      const midEnergy = (userLevels[2] + userLevels[3]) / 2;
      if (midEnergy < 0.1) {
          setAnalysis([]);
          return; 
      }

      // 4. Normalization (Auto-Gain Offset) based on Average of LowMid and Mid
      // We align the User's Body/Mid Level to the Target's Body/Mid Level
      const userAnchor = (userLevels[2] + userLevels[3]) / 2;
      const targetAnchor = (bands[2].targetVal + bands[3].targetVal) / 2;
      const offset = targetAnchor - userAnchor;

      const results: AnalysisResult[] = bands.map((band, i) => {
          const userValNormalized = userLevels[i] + offset;
          const diff = userValNormalized - band.targetVal; // Positive = User is louder
          
          // Thresholds (approx 0.07 is roughly 5-6dB in this linear normalized scale)
          let status: 'ok' | 'warning' | 'critical' = 'ok';
          const absDiff = Math.abs(diff);
          
          if (absDiff > 0.15) status = 'critical';
          else if (absDiff > 0.07) status = 'warning';

          let message = 'OK';
          if (status !== 'ok') {
              message = diff > 0 ? 'Exceso' : 'Falta';
          }

          return {
              band: band.label,
              range: band.range,
              status,
              diff,
              message
          };
      });

      setAnalysis(results);
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

          // Gradient Background
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "rgba(20,20,20,0)");
          gradient.addColorStop(1, "rgba(20,20,20,0.5)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0,0, width, height);

          // --- 1. Draw Grid (Logarithmic Scale) ---
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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
              ctx.fillStyle = 'rgba(255,255,255,0.4)';
              ctx.font = '10px "Exo 2", sans-serif';
              ctx.fillText(labels[i], x + 4, height - 6);
          });
          ctx.stroke();

          // Draw baseline (0dB equivalent visually)
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();


          // --- 2. Draw Reference Curve (The Ghost) ---
          const targetFreqs = [40, 100, 300, 1000, 3000, 8000, 15000];
          const curveXPositions = targetFreqs.map(f => getX(f));
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Target color - thinner
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          
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


          // --- 3. Audio Data Processing ---
          if (analyserRef.current && audioContextRef.current) {
              const bufferLength = analyserRef.current.frequencyBinCount;
              const sampleRate = audioContextRef.current.sampleRate;

              // Ensure Peak Buffer exists
              if (!peakDataRef.current || peakDataRef.current.length !== bufferLength) {
                  peakDataRef.current = new Float32Array(bufferLength);
              }

              const dataArray = new Uint8Array(bufferLength);
              
              // If playing, get real data. If not, we might want to show silence or last snapshot
              if (isPlayingRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  
                  // Update Peaks
                  for (let i = 0; i < bufferLength; i++) {
                     if (dataArray[i] > peakDataRef.current[i]) {
                         peakDataRef.current[i] = dataArray[i];
                     }
                  }
              }

              // --- 3B. Draw Real-time Spectrum ---
              if (isPlayingRef.current) {
                  ctx.beginPath();
                  ctx.strokeStyle = '#0ea5e9'; // Sky Blue (Theme Accent)
                  ctx.lineWidth = 2;
                  ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
                  ctx.moveTo(0, height);
                  
                  for (let x = 0; x < width; x += 2) {
                      const freq = Math.pow(10, (x / scale) + minLog);
                      const binIndex = Math.floor(freq * (bufferLength * 2) / sampleRate);
                      if (binIndex >= bufferLength) break;

                      const rawValue = dataArray[binIndex] / 255; // 0.0 to 1.0
                      
                      let finalValue = rawValue * visualGainRef.current;
                      finalValue = Math.min(Math.max(finalValue, 0), 1);
                      
                      const y = height - (finalValue * height);
                      ctx.lineTo(x, y);
                  }
                  ctx.lineTo(width, height); 
                  ctx.fill();
                  ctx.stroke();
              }

              // --- 3C. Draw Peak Hold Line (Cyan - Persistent - ALWAYS ON) ---
              if (peakDataRef.current) {
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

              // --- 4. INSPECTOR (Crosshair) ---
              if (mousePosRef.current) {
                  const { x, y } = mousePosRef.current;
                  
                  // Calculate Freq from X
                  const freq = Math.pow(10, (x / scale) + minLog);
                  
                  // Get dB value at this freq
                  const binIndex = Math.floor(freq * (bufferLength * 2) / sampleRate);
                  let dbValue = -100; // Default silence
                  
                  if (binIndex < bufferLength) {
                      // Prioritize Realtime, fall back to Peak
                      if (isPlayingRef.current) {
                          const normalized = dataArray[binIndex] / 255;
                          dbValue = -100 + (normalized * 70); // approx range
                      } else if (peakDataRef.current) {
                          const normalized = peakDataRef.current[binIndex] / 255;
                          dbValue = -100 + (normalized * 70);
                      }
                  }

                  // Draw Crosshair Lines
                  ctx.beginPath();
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                  ctx.lineWidth = 1;
                  ctx.setLineDash([4, 4]);
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, height);
                  ctx.moveTo(0, y); 
                  ctx.lineTo(width, y);
                  ctx.stroke();
                  ctx.setLineDash([]);

                  // Draw Tooltip
                  const text = `${Math.round(freq)} Hz | ${dbValue.toFixed(1)} dB`;
                  const textWidth = ctx.measureText(text).width + 20;
                  const textX = x + 10 > width - textWidth ? x - textWidth - 10 : x + 10;
                  const textY = y - 30 < 0 ? y + 20 : y - 30;

                  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                  ctx.fillRect(textX, textY, textWidth, 24);
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                  ctx.strokeRect(textX, textY, textWidth, 24);
                  
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 11px monospace';
                  ctx.fillText(text, textX + 10, textY + 16);
                  
                  // Draw small circle at cursor intersection
                  ctx.beginPath();
                  ctx.fillStyle = '#ffffff';
                  ctx.arc(x, y, 3, 0, Math.PI * 2);
                  ctx.fill();
              }
          }

          animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
  };

  // Refs for animation loop
  const activeCurveRef = useRef(selectedGenre.curve);
  const visualGainRef = useRef(visualGain);
  const showPeakHoldRef = useRef(true); // Always true now

  useEffect(() => {
      activeCurveRef.current = selectedGenre.curve;
  }, [selectedGenre]);
  
  useEffect(() => {
      visualGainRef.current = visualGain;
  }, [visualGain]);
  
  // Display Logic for Smoothing Time
  const getSmoothingLabel = (val: number) => {
      if (val <= 0.93) return "Fast";
      if (val >= 0.99) return "Slow";
      return "Avg";
  };


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
        <div className="flex flex-col border-b border-theme-border-secondary/50 z-50 relative">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-3 bg-[#111]">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">SPECTRUM TARGET</span>
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
                                isPlayingRef.current = false; 
                                audioElementRef.current?.pause(); 
                                setAnalysis([]); 
                                setAudioBuffer(null);
                                clearPeaks();
                            }} className="text-gray-500 hover:text-red-400">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={clearPeaks} 
                        className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        title="Reset Peaks"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sub-Toolbar */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-[#0f0f0f] text-xs border-t border-black/50">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-bold uppercase tracking-wider">Target:</span>
                    <select
                        value={selectedGenreId}
                        onChange={(e) => setSelectedGenreId(e.target.value)}
                        className="bg-[#1a1a1a] border border-gray-700 text-gray-300 rounded px-2 py-1 focus:border-theme-accent outline-none max-w-[180px] truncate"
                    >
                        {genres.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
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
                <div className="p-4 bg-[#151515] border-t border-gray-800 animate-fade-in-step relative z-50">
                    <HeadphoneCorrectionControls 
                        calibrationState={calibrationState}
                        onCalibrationChange={onCalibrationChange}
                    />
                </div>
            )}
        </div>

        {/* --- Waveform Scrubber Area (NEW) --- */}
        <div className="bg-[#080808] border-b border-theme-border-secondary/30 h-16 relative flex items-center justify-center z-0 w-full overflow-hidden">
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
        <div className="flex-grow p-4 lg:p-6 flex flex-col gap-4 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
            
            {/* 1. The Spectrum Canvas */}
            <div 
                className="relative w-full h-64 md:h-80 bg-[#080808] rounded-xl border border-gray-800 overflow-hidden shadow-inner cursor-crosshair group"
                onClick={clearPeaks}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
            >
                <canvas ref={canvasRef} width={1024} height={320} className="w-full h-full" />
                
                {/* Overlay Labels */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Target Curve</span>
                    <span className="text-sm font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">{selectedGenre.name}</span>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
                    <span className="text-[9px] text-gray-600 uppercase font-bold tracking-wider bg-black/80 px-2 py-1 rounded">Click to Reset Peak</span>
                </div>
            </div>

            {/* 2. The "Meter Bridge" Analysis (Horizontal) */}
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Frequency Balance Diagnostic</h3>
                    {analysis.length === 0 && isPlaying && <span className="text-[10px] text-gray-600 animate-pulse">Analyzing...</span>}
                </div>
                
                {analysis.length > 0 ? (
                    <div className="grid grid-cols-7 gap-2">
                        {analysis.map((res, idx) => {
                            let colorClass = 'text-gray-400';
                            let borderClass = 'border-gray-800 bg-[#151515]';
                            let statusIcon = null;

                            if (res.status === 'ok') {
                                colorClass = 'text-theme-success';
                                borderClass = 'border-theme-success/20 bg-theme-success/5';
                                statusIcon = <CheckCircleIcon className="w-3 h-3" />;
                            } else if (res.status === 'warning') {
                                colorClass = 'text-yellow-500';
                                borderClass = 'border-yellow-500/20 bg-yellow-500/5';
                                statusIcon = <span className="text-[10px] font-bold">{res.diff > 0 ? 'HIGH' : 'LOW'}</span>;
                            } else if (res.status === 'critical') {
                                colorClass = 'text-theme-danger';
                                borderClass = 'border-theme-danger/20 bg-theme-danger/5';
                                statusIcon = <span className="text-[10px] font-bold">{res.diff > 0 ? 'TOO LOUD' : 'TOO QUIET'}</span>;
                            }

                            return (
                                <div key={idx} className={`flex flex-col items-center justify-center p-2 rounded border ${borderClass} min-h-[60px]`}>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{res.band}</span>
                                    <div className={`flex flex-col items-center mt-1 ${colorClass}`}>
                                        {statusIcon}
                                        {res.status !== 'ok' && <span className="text-[9px] font-mono mt-0.5">{res.diff > 0 ? '+' : ''}{Math.round(res.diff * 100)}%</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-[60px] flex items-center justify-center border border-dashed border-gray-800 rounded text-gray-600 text-xs">
                        Waiting for audio signal...
                    </div>
                )}
            </div>

            {/* 3. Footer Controls (Compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase w-16">Visual Gain</span>
                    <input 
                        type="range" min="0.5" max="1.5" step="0.01"
                        value={visualGain}
                        onChange={(e) => setVisualGain(Number(e.target.value))}
                        className="flex-grow h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-theme-accent"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase w-16">Smoothing</span>
                    <input 
                        type="range" min="0.90" max="0.99" step="0.001"
                        value={smoothing}
                        onChange={(e) => setSmoothing(Number(e.target.value))}
                        className="flex-grow h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-theme-success"
                    />
                    <span className="text-[9px] font-mono text-gray-400 w-8 text-right">{getSmoothingLabel(smoothing)}</span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReferenceTracksModal;