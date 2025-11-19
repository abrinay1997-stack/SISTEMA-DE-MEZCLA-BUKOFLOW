
import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, XIcon } from './icons';

const WORK_TIME = 45 * 60; // 45 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

const FatigueMonitor: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [status, setStatus] = useState<'idle' | 'working' | 'break'>('idle');
  const [showBreakModal, setShowBreakModal] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: number;

    if (status === 'working' || status === 'break') {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);

  const playBellSound = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // FM Synthesis for a bell-like tone
    const modOsc = ctx.createOscillator();
    const modGain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    modOsc.connect(modGain);
    modGain.connect(osc.frequency);

    // Fundamental frequency
    osc.type = 'sine';
    osc.frequency.value = 523.25; // C5
    
    // Modulator setup (for metallic partials)
    modOsc.type = 'sine';
    modOsc.frequency.value = 523.25 * 2.5; // Non-integer ratio
    modGain.gain.value = 300; // Modulation index

    const now = ctx.currentTime;
    
    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5); // Long decay

    // Modulator Envelope (makes brightness decay faster)
    modGain.gain.setValueAtTime(300, now);
    modGain.gain.exponentialRampToValueAtTime(1, now + 1.5);

    osc.start(now);
    modOsc.start(now);
    
    osc.stop(now + 4);
    modOsc.stop(now + 4);
  };

  const handleTimerComplete = () => {
    playBellSound();
    if (status === 'working') {
      setStatus('break');
      setTimeLeft(BREAK_TIME);
      setShowBreakModal(true);
    } else {
      // Break finished
      setStatus('idle');
      setTimeLeft(WORK_TIME);
      setShowBreakModal(false);
    }
  };

  const toggleTimer = () => {
    if (status === 'idle') {
      setStatus('working');
    } else {
      setStatus('idle');
      setTimeLeft(WORK_TIME);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  const getStatusColor = () => {
      if (status === 'working') return 'text-theme-accent border-theme-accent bg-theme-accent/10';
      if (status === 'break') return 'text-theme-success border-theme-success bg-theme-success/10';
      return 'text-theme-text-secondary border-theme-border hover:bg-white/5';
  };

  return (
    <>
      <button
        onClick={toggleTimer}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${getStatusColor()}`}
        title={status === 'idle' ? "Iniciar Monitor de Fatiga" : "Detener Monitor"}
      >
        <BellIcon className={`w-4 h-4 ${status !== 'idle' ? 'animate-pulse' : ''}`} />
        <span>{status === 'idle' ? 'Fatiga OFF' : formatTime(timeLeft)}</span>
      </button>

      {showBreakModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in-backdrop">
          <div className="text-center p-8 max-w-lg w-full">
            <div className="mb-6 inline-flex p-4 rounded-full bg-theme-accent/20 animate-bounce">
                <BellIcon className="w-12 h-12 text-theme-accent" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Fatiga Auditiva Detectada</h2>
            <p className="text-xl text-gray-300 mb-8">Tus oídos necesitan un reseteo.</p>
            
            <div className="bg-white/10 rounded-xl p-6 border border-white/10 mb-8">
                <p className="text-4xl font-mono font-bold text-theme-success mb-2">
                    {formatTime(timeLeft)}
                </p>
                <p className="text-sm text-gray-400 uppercase tracking-widest">Tiempo de Descanso</p>
            </div>

            <ul className="text-left text-gray-300 space-y-3 mb-8 bg-black/30 p-6 rounded-lg">
                <li className="flex items-center gap-2">🤫 <strong>Silencio Total:</strong> Quítate los auriculares.</li>
                <li className="flex items-center gap-2">💧 <strong>Hidrátate:</strong> Bebe un vaso de agua.</li>
                <li className="flex items-center gap-2">👀 <strong>Vista Lejana:</strong> Mira por una ventana.</li>
            </ul>

            <button
              onClick={() => setShowBreakModal(false)}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              <XIcon className="w-5 h-5" />
              Ignorar por ahora (No recomendado)
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FatigueMonitor;
