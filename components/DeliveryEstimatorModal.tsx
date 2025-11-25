
import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, CalculatorIcon, ClockIcon, CalendarIcon, ChartBarIcon } from './icons';
import type { Project } from '../types';
import { MIXING_STEPS } from '../constants';

interface DeliveryEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

const DeliveryEstimatorModal: React.FC<DeliveryEstimatorModalProps> = ({ isOpen, onClose, projects }) => {
  const [mode, setMode] = useState<'project' | 'manual'>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Inputs
  const [startDate, setStartDate] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(4);
  
  // Calculation Results
  const [result, setResult] = useState<{
    estimatedDate: string | null;
    hoursRemaining: number;
    realPace: string; // Human readable pace
    message: string;
    status: 'idle' | 'success' | 'warning' | 'completed';
  } | null>(null);

  const totalSubSteps = useMemo(() =>
    MIXING_STEPS.reduce((count, step) => count + step.subSteps.length, 0),
    []
  );

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      if (projects.length > 0) {
        setMode('project');
        handleProjectSelect(projects[0].id);
      } else {
        setMode('manual');
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
      }
    }
  }, [isOpen, projects]);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    const project = projects.find(p => p.id === id);
    if (project) {
      // Calculate actual progress
      const feedbackMap = new Map(project.subStepFeedback as any);
      const completedCount = Array.from(feedbackMap.values()).filter((f: any) => f.completed).length;
      const calculatedProgress = totalSubSteps > 0 ? (completedCount / totalSubSteps) * 100 : 0;
      
      setProgressPercent(Math.round(calculatedProgress));
      
      // Convert timestamp to YYYY-MM-DD
      const date = new Date(project.createdAt);
      const formattedDate = date.toISOString().split('T')[0];
      setStartDate(formattedDate);
    }
  };

  const calculate = () => {
    if (!startDate) return;

    const start = new Date(startDate);
    const today = new Date();
    
    // Reset time portions for accurate day diff
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const timeDiff = today.getTime() - start.getTime();
    const elapsedDays = Math.max(1, timeDiff / (1000 * 3600 * 24)); // At least 1 day to avoid division by zero

    if (progressPercent <= 0) {
        setResult({
            estimatedDate: "--/--/----",
            hoursRemaining: 0,
            realPace: "0%",
            message: "Necesitas avanzar en el proyecto para calcular tu ritmo.",
            status: 'warning'
        });
        return;
    }

    if (progressPercent >= 100) {
        setResult({
            estimatedDate: "COMPLETADO",
            hoursRemaining: 0,
            realPace: "Finalizado",
            message: "¡El proyecto ya está terminado!",
            status: 'completed'
        });
        return;
    }
    
    if (start > today) {
         setResult({
            estimatedDate: "ERROR",
            hoursRemaining: 0,
            realPace: "N/A",
            message: "La fecha de inicio no puede ser futura.",
            status: 'warning'
        });
        return;
    }

    // Pace = Progress per Day
    const progressPerDay = progressPercent / elapsedDays;
    const remainingPercent = 100 - progressPercent;
    
    const daysToFinish = remainingPercent / progressPerDay;
    
    const completionDate = new Date();
    completionDate.setDate(today.getDate() + Math.ceil(daysToFinish));

    // Estimated Active Work Hours Left
    const estimatedHoursLeft = Math.ceil(daysToFinish * dailyWorkHours);

    setResult({
        estimatedDate: completionDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        hoursRemaining: estimatedHoursLeft,
        realPace: `${progressPerDay.toFixed(2)}% / día`,
        message: "Proyección basada en tu ritmo actual.",
        status: 'success'
    });
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
                        <CalculatorIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">DELIVERY ESTIMATOR</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded text-gray-400 hover:bg-white/10 hover:text-white transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sub-Toolbar (Mode Switcher) */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-[#0f0f0f] text-xs border-t border-black/50">
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    <button 
                        className={`px-4 py-1 rounded-md font-bold transition-all uppercase ${mode === 'project' ? 'bg-theme-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setMode('project')}
                    >
                        Vincular Proyecto
                    </button>
                    <button 
                        className={`px-4 py-1 rounded-md font-bold transition-all uppercase ${mode === 'manual' ? 'bg-theme-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => { setMode('manual'); setResult(null); }}
                    >
                        Modo Manual
                    </button>
                </div>
            </div>
        </div>

        {/* --- Main Dashboard Area --- */}
        <div className="flex-grow p-4 lg:p-6 flex flex-col md:flex-row gap-6 bg-[#050505] overflow-y-auto custom-scrollbar z-0 relative">
            
            {/* Left Panel: Parameters */}
            <div className="md:w-1/2 flex flex-col gap-5">
                
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-1">Parámetros de Entrada</h3>
                    
                    {/* Project Select */}
                    {mode === 'project' && (
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-gray-400 uppercase">Proyecto</label>
                            <select 
                                value={selectedProjectId} 
                                onChange={(e) => handleProjectSelect(e.target.value)}
                                className="w-full p-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-theme-accent outline-none"
                            >
                                {projects.length === 0 && <option value="">No hay proyectos creados</option>}
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-gray-400 uppercase">Fecha Inicio</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={mode === 'project'}
                                    className={`w-full pl-9 p-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-theme-accent outline-none ${mode === 'project' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-gray-400 uppercase">Hrs/Día</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ClockIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <input 
                                    type="number"
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    value={dailyWorkHours}
                                    onChange={(e) => setDailyWorkHours(Number(e.target.value))}
                                    min="1" max="24"
                                    className="w-full pl-9 p-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-theme-accent outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Progress Slider */}
                    <div>
                        <label className="block mb-2 text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                            <span>Progreso Actual</span>
                            <span className="text-theme-accent">{progressPercent}%</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={progressPercent}
                            onChange={(e) => setProgressPercent(Number(e.target.value))}
                            disabled={mode === 'project'} // Progress locked to actual project stats
                            className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-theme-accent ${mode === 'project' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <button 
                    onClick={calculate}
                    className="w-full py-4 rounded-lg font-bold text-sm tracking-widest bg-theme-accent text-white shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.4)] hover:bg-white hover:text-black transition-all uppercase"
                >
                    Calcular Proyección
                </button>

            </div>

            {/* Right Panel: The Monitor */}
            <div className="md:w-1/2 bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-inner relative overflow-hidden">
                
                <div className="flex justify-between items-start z-10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estimation Result</h3>
                    {result && <div className={`w-2 h-2 rounded-full animate-pulse ${result.status === 'success' || result.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>}
                </div>

                <div className="flex-grow flex flex-col items-center justify-center z-10 py-8">
                    <span className="text-xs font-mono text-gray-600 mb-2">TARGET COMPLETION DATE</span>
                    <div className={`text-4xl md:text-5xl font-mono font-bold text-center tracking-tighter ${result?.status === 'completed' ? 'text-theme-success' : 'text-white'}`}>
                        {result ? result.estimatedDate : '--/--/----'}
                    </div>
                    <div className={`mt-4 px-3 py-1 rounded border text-xs ${result ? 'opacity-100' : 'opacity-0'} ${result?.status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-gray-700 bg-black/40 text-gray-400'}`}>
                        {result?.message || 'Ready'}
                    </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4 z-10">
                    <div className="bg-[#151515] p-3 rounded border border-gray-800/50">
                        <div className="flex items-center gap-2 mb-1">
                            <ClockIcon className="w-3 h-3 text-theme-accent-secondary" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Work Remaining</span>
                        </div>
                        <p className="text-lg font-mono text-gray-200">{result ? `${result.hoursRemaining}h` : '--'}</p>
                    </div>
                    <div className="bg-[#151515] p-3 rounded border border-gray-800/50">
                        <div className="flex items-center gap-2 mb-1">
                            <ChartBarIcon className="w-3 h-3 text-theme-accent" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Real Velocity</span>
                        </div>
                        <p className="text-lg font-mono text-gray-200">{result ? result.realPace : '--'}</p>
                    </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-theme-accent/5 to-transparent rounded-bl-full pointer-events-none"></div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DeliveryEstimatorModal;
