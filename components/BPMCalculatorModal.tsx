
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, MetronomeIcon, ArrowPathIcon, ClockIcon } from './icons';

interface BPMCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NoteType = 'lineal' | 'tresillo' | 'punteada';

const BPMCalculatorModal: React.FC<BPMCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [bpm, setBpm] = useState<number | ''>(120);
  const [noteType, setNoteType] = useState<NoteType>('lineal');
  const [taps, setTaps] = useState<number[]>([]);
  const [tapText, setTapText] = useState<string>('TAP TEMPO');
  const [beatFlash, setBeatFlash] = useState(false);

  // Results
  const [results, setResults] = useState<{ name: string, key: string, durationS: string, durationMs: string, frequency: string }[]>([]);

  // Metronome Interval Ref
  const intervalRef = useRef<number | null>(null);

  // Calculation Effect
  useEffect(() => {
    if (isOpen && typeof bpm === 'number' && bpm > 0) {
      calculate(bpm, noteType);
      startMetronome(bpm);
    } else {
        stopMetronome();
    }
    return () => stopMetronome();
  }, [isOpen, bpm, noteType]);

  const startMetronome = (currentBpm: number) => {
      stopMetronome();
      const msPerBeat = 60000 / currentBpm;
      
      intervalRef.current = window.setInterval(() => {
          setBeatFlash(true);
          setTimeout(() => setBeatFlash(false), 100); // Short flash
      }, msPerBeat);
  };

  const stopMetronome = () => {
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
      setBeatFlash(false);
  };

  const calculate = (currentBpm: number, currentType: NoteType) => {
    if (isNaN(currentBpm) || currentBpm <= 0) return;

    const beatDuration = 60000 / currentBpm; // Duration of a beat in ms
    
    const subdivisiones = { '1/1': 4, '1/2': 2, '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125, '1/64': 0.0625 };
    
    const nombresNotas: Record<NoteType, Record<string, string>> = {
        'lineal': { '1/1': 'Redonda', '1/2': 'Blanca', '1/4': 'Negra', '1/8': 'Corchea', '1/16': 'Semicorchea', '1/32': 'Fusa', '1/64': 'Semifusa' },
        'tresillo': { '1/4T': 'Negra Tresillo', '1/8T': 'Corchea Tresillo', '1/16T': 'Semi Tresillo', '1/32T': 'Fusa Tresillo' },
        'punteada': { '1/2.': 'Blanca Puntillo', '1/4.': 'Negra Puntillo', '1/8.': 'Corchea Puntillo', '1/16.': 'Semi Puntillo' }
    };

    const duraciones: Record<string, number> = {};
    const newResults: any[] = [];

    if (currentType === 'lineal') {
        for (const [key, value] of Object.entries(subdivisiones)) {
            duraciones[key] = beatDuration * value;
        }
    } else if (currentType === 'tresillo') {
        duraciones['1/4T'] = (beatDuration * 2) / 3;
        duraciones['1/8T'] = beatDuration / 3;
        duraciones['1/16T'] = beatDuration / 6;
        duraciones['1/32T'] = beatDuration / 12;
    } else if (currentType === 'punteada') {
        duraciones['1/2.'] = beatDuration * 3;
        duraciones['1/4.'] = beatDuration * 1.5;
        duraciones['1/8.'] = beatDuration * 0.75;
        duraciones['1/16.'] = beatDuration * 0.375;
    }

    for (const key in duraciones) {
        const noteDurationMs = duraciones[key];
        const noteDurationS = noteDurationMs / 1000;
        const frequency = (noteDurationMs > 0) ? 1000 / noteDurationMs : 0;
        
        newResults.push({
            name: nombresNotas[currentType][key],
            key: key,
            durationS: noteDurationS.toFixed(3),
            durationMs: noteDurationMs.toFixed(2),
            frequency: frequency.toFixed(2)
        });
    }
    
    setResults(newResults);
  };

  const handleTap = () => {
    const now = Date.now();
    let newTaps = [...taps];

    if (newTaps.length > 0 && (now - newTaps[newTaps.length - 1]) > 2000) {
        newTaps = []; 
    }

    newTaps.push(now);
    setTaps(newTaps);
    setTapText('Detecting...');

    if (newTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
            intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        if (averageInterval > 0) {
            const calculatedBPM = Math.round(60000 / averageInterval);
            setBpm(calculatedBPM);
        }
    }
    
    setTimeout(() => setTapText('TAP TEMPO'), 200);
  };

  const handleReset = () => {
      setTaps([]);
      setBpm(120);
      setTapText('TAP TEMPO');
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
          setBpm('');
      } else {
          setBpm(Number(val));
      }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] backdrop-blur-xl border border-theme-border-secondary rounded-lg shadow-2xl w-full max-w-4xl flex flex-col animate-scale-up overflow-hidden max-h-[95vh] pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header & Toolbar --- */}
        <div className="flex flex-col border-b border-theme-border-secondary/50 z-20 relative">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-3 bg-[#111]">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-theme-accent flex items-center gap-2">
                        <MetronomeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">TIME SYNC CALCULATOR</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sub-Toolbar (Note Type & Reset) */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#0f0f0f] text-xs border-t border-black/50">
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {(['lineal', 'tresillo', 'punteada'] as NoteType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setNoteType(type)}
                            className={`px-3 py-1 rounded-md font-bold transition-all uppercase ${noteType === type ? 'bg-theme-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
                >
                    <ArrowPathIcon className="w-3 h-3" />
                    RESET
                </button>
            </div>
        </div>

        {/* --- Main Dashboard Area --- */}
        <div className="flex-grow p-4 lg:p-6 flex flex-col md:flex-row gap-6 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
            
            {/* Left Panel: The Machine */}
            <div className="md:w-1/3 flex flex-col gap-6">
                
                {/* BPM Display */}
                <div className="bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    {/* Visual Metronome LED */}
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-75 ${beatFlash ? 'bg-theme-accent shadow-[0_0_15px_var(--theme-accent)] scale-125' : 'bg-[#222]'}`}></div>
                    
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Current Tempo</p>
                    <div className="relative z-10 text-center">
                        <input 
                            type="number"
                            value={bpm}
                            onChange={handleBpmChange}
                            className="bg-transparent text-6xl font-mono font-bold text-center text-white outline-none w-full appearance-none m-0 p-0"
                        />
                        <span className="text-xl text-gray-600 font-medium block mt-1">BPM</span>
                    </div>
                </div>

                {/* Tap Pad */}
                <button
                    onMouseDown={handleTap}
                    onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
                    className="group relative h-32 rounded-xl bg-[#151515] border-2 border-gray-800 active:border-theme-accent active:scale-[0.98] transition-all flex flex-col items-center justify-center overflow-hidden shadow-lg"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--theme-accent),transparent_70%)] opacity-0 group-active:opacity-20 transition-opacity duration-100"></div>
                    <div className="z-10 flex flex-col items-center">
                        <span className="text-2xl font-black text-gray-300 group-active:text-theme-accent tracking-widest">{tapText}</span>
                        <span className="text-[9px] text-gray-600 uppercase font-bold mt-1">Click or Spacebar</span>
                    </div>
                </button>

                {/* Stats */}
                <div className="flex justify-between px-4 py-2 bg-black/20 rounded border border-white/5">
                    <span className="text-xs text-gray-500 font-bold">TAPS</span>
                    <span className="text-xs text-theme-accent font-mono">{taps.length}</span>
                </div>

            </div>

            {/* Right Panel: The Data Grid */}
            <div className="md:w-2/3 bg-[#111] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-800 bg-[#151515] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time & Frequency Map</h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <ClockIcon className="w-3 h-3" />
                        <span>Synced</span>
                    </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-grow">
                    <table className="w-full text-left">
                        <thead className="bg-[#0a0a0a] text-[10px] text-gray-500 uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-bold">Note</th>
                                <th className="px-4 py-3 font-bold text-right">Duration (ms)</th>
                                <th className="px-4 py-3 font-bold text-right">Freq (Hz)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-mono">
                            {results.map((row, index) => (
                                <tr key={index} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-300 font-sans">
                                        {row.name} <span className="text-gray-600 text-xs ml-1">({row.key})</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-theme-accent-secondary font-bold">
                                        {row.durationMs} <span className="text-gray-600 text-[10px] font-normal">ms</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-theme-accent">
                                        {row.frequency} <span className="text-gray-600 text-[10px] font-normal">Hz</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default BPMCalculatorModal;
