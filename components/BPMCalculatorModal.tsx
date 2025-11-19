import React, { useState, useEffect } from 'react';
import { XIcon, MetronomeIcon } from './icons';

interface BPMCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NoteType = 'lineal' | 'tresillo' | 'punteada';

const BPMCalculatorModal: React.FC<BPMCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [noteType, setNoteType] = useState<NoteType>('lineal');
  const [taps, setTaps] = useState<number[]>([]);
  const [tapText, setTapText] = useState<string>('Tap');
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Results
  const [results, setResults] = useState<{ name: string, key: string, durationS: string, durationMs: string, frequency: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      calculate(bpm, noteType);
    }
  }, [isOpen, bpm, noteType]);

  const calculate = (currentBpm: number, currentType: NoteType) => {
    if (isNaN(currentBpm) || currentBpm <= 0) return;

    const beatDuration = 60000 / currentBpm; // Duration of a beat in ms
    
    const subdivisiones = { '1/1': 4, '1/2': 2, '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125, '1/64': 0.0625 };
    
    const nombresNotas: Record<NoteType, Record<string, string>> = {
        'lineal': { '1/1': 'Redonda', '1/2': 'Blanca', '1/4': 'Negra', '1/8': 'Corchea', '1/16': 'Semicorchea', '1/32': 'Fusa', '1/64': 'Semifusa' },
        'tresillo': { '1/4T': 'Negra de Tresillo', '1/8T': 'Corchea de Tresillo', '1/16T': 'Semicorchea de Tresillo', '1/32T': 'Fusa de Tresillo' },
        'punteada': { '1/2.': 'Blanca con Puntillo', '1/4.': 'Negra con Puntillo', '1/8.': 'Corchea con Puntillo', '1/16.': 'Semicorchea con Puntillo' }
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
    
    // Sort to keep consistent order if needed, though iteration usually preserves insertion order for non-integer keys
    setResults(newResults);
  };

  const handleTap = () => {
    const now = Date.now();
    let newTaps = [...taps];

    if (newTaps.length > 0 && (now - newTaps[newTaps.length - 1]) > 2000) {
        newTaps = []; // Reset if paused too long
    }

    newTaps.push(now);
    setTaps(newTaps);
    setTapText('Tapping...');
    setAnimationKey(prev => prev + 1);

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
    
    // Reset text after delay
    setTimeout(() => setTapText('Tap'), 200);
  };

  const handleReset = () => {
      setTaps([]);
      setBpm(120);
      setTapText('Tap');
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-2xl flex flex-col animate-scale-up max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
          <h2 className="text-xl font-bold text-theme-accent flex items-center gap-2">
            <MetronomeIcon className="w-6 h-6" />
            Calculadora BPM
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-theme-text-secondary">BPM (Beats Per Minute) 🎵</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={bpm}
                                onChange={(e) => setBpm(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-theme-accent text-center font-mono text-lg"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            key={animationKey}
                            onClick={handleTap}
                            className="flex-grow py-3 bg-gradient-to-r from-theme-accent to-theme-accent-secondary text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                            {tapText}
                        </button>
                        <button 
                            onClick={handleReset}
                            className="px-4 py-3 bg-theme-danger/20 text-theme-danger border border-theme-danger/50 font-bold rounded-lg hover:bg-theme-danger/30 transition-all"
                        >
                            Reset
                        </button>
                    </div>
                    <p className="text-center text-xs text-theme-text-secondary">{taps.length} taps registrados</p>
                </div>

                <div>
                     <label className="block mb-2 text-sm font-semibold text-theme-text-secondary">Tipo de Compás 🎼</label>
                     <div className="flex flex-col gap-2">
                        {(['lineal', 'tresillo', 'punteada'] as NoteType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => setNoteType(type)}
                                className={`py-2 px-4 rounded-md text-sm font-semibold border transition-all text-left ${noteType === type ? 'border-theme-accent bg-theme-accent/20 text-theme-accent' : 'border-theme-border text-theme-text-secondary hover:bg-white/5'}`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                     </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg border-theme-border overflow-hidden bg-black/20">
                <table className="w-full text-sm text-left text-theme-text">
                    <thead className="bg-white/5 text-xs text-theme-accent uppercase">
                        <tr>
                            <th className="px-4 py-3">Nota</th>
                            <th className="px-4 py-3 text-center">Seg (s)</th>
                            <th className="px-4 py-3 text-center">Ms</th>
                            <th className="px-4 py-3 text-center">Hz</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row, index) => (
                            <tr key={index} className="border-b border-theme-border/50 hover:bg-white/5">
                                <td className="px-4 py-3 font-medium">{row.name} <span className="text-theme-text-secondary text-xs">({row.key})</span></td>
                                <td className="px-4 py-3 text-center font-mono text-theme-accent-secondary">{row.durationS}</td>
                                <td className="px-4 py-3 text-center font-mono">{row.durationMs}</td>
                                <td className="px-4 py-3 text-center font-mono text-theme-text-secondary">{row.frequency}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
      </div>
    </div>
  );
};

export default BPMCalculatorModal;