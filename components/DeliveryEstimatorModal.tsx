import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, CalculatorIcon, ClockIcon } from './icons';
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
            estimatedDate: null,
            hoursRemaining: 0,
            realPace: "0%",
            message: "Necesitas avanzar en el proyecto para calcular tu ritmo."
        });
        return;
    }

    if (progressPercent >= 100) {
        setResult({
            estimatedDate: "Completado",
            hoursRemaining: 0,
            realPace: "Finalizado",
            message: "¡El proyecto ya está terminado!"
        });
        return;
    }
    
    if (start > today) {
         setResult({
            estimatedDate: null,
            hoursRemaining: 0,
            realPace: "N/A",
            message: "La fecha de inicio no puede ser futura."
        });
        return;
    }

    // Logic adapted from the reference (BUKOFLOW)
    // Pace = Progress per Day
    const progressPerDay = progressPercent / elapsedDays;
    const remainingPercent = 100 - progressPercent;
    
    const daysToFinish = remainingPercent / progressPerDay;
    
    const completionDate = new Date();
    completionDate.setDate(today.getDate() + Math.ceil(daysToFinish));

    // Estimate remaining work hours based on the "User's Goal" input
    // Assumption: To finish X% remaining, if I define "100%" as Y hours... wait.
    // The reference logic calculates "Remaining Work Time" based on the USER INPUT of daily hours.
    // So: DaysToFinish * DailyHoursInput = Estimated Active Work Hours Left.
    const estimatedHoursLeft = Math.ceil(daysToFinish * dailyWorkHours);

    setResult({
        estimatedDate: completionDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        hoursRemaining: estimatedHoursLeft,
        realPace: `${progressPerDay.toFixed(2)}% / día`,
        message: "Basado en tu ritmo actual."
    });
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
          <h2 className="text-xl font-bold text-theme-accent flex items-center gap-2">
            <CalculatorIcon className="w-6 h-6" />
            Proyección de Entrega
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            
            {/* Mode Switcher */}
            <div className="flex rounded-md bg-black/20 p-1 border border-theme-border">
                <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'project' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-text-secondary hover:text-theme-text'}`}
                    onClick={() => setMode('project')}
                >
                    Vincular a Proyecto
                </button>
                <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'manual' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-text-secondary hover:text-theme-text'}`}
                    onClick={() => { setMode('manual'); setResult(null); }}
                >
                    Cálculo Manual
                </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mode === 'project' && (
                    <div className="md:col-span-2">
                        <label className="block mb-2 text-sm font-semibold text-theme-text-secondary">Seleccionar Proyecto</label>
                        <select 
                            value={selectedProjectId} 
                            onChange={(e) => handleProjectSelect(e.target.value)}
                            className="w-full p-2.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-theme-accent"
                        >
                            {projects.length === 0 && <option value="">No hay proyectos creados</option>}
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block mb-2 text-sm font-semibold text-theme-text-secondary">Fecha de Inicio</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={mode === 'project'} // Start date is locked to project creation date
                        className={`w-full p-2.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-theme-accent ${mode === 'project' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-semibold text-theme-text-secondary">Horas de trabajo / día</label>
                    <input 
                        type="number" 
                        value={dailyWorkHours}
                        onChange={(e) => setDailyWorkHours(Number(e.target.value))}
                        min="1" max="24"
                        className="w-full p-2.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-theme-accent"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-theme-text-secondary flex justify-between">
                        <span>Progreso Actual</span>
                        <span className="text-theme-accent font-bold">{progressPercent}%</span>
                    </label>
                    <input 
                        type="range" 
                        min="0" max="100" 
                        value={progressPercent}
                        onChange={(e) => setProgressPercent(Number(e.target.value))}
                        disabled={mode === 'project'} // Progress locked to actual project stats
                        className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${mode === 'project' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                </div>
            </div>

            <button 
                onClick={calculate}
                className="w-full py-3 bg-gradient-to-r from-theme-accent to-theme-accent-secondary text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all"
            >
                Calcular Proyección
            </button>

            {/* Results */}
            <div className="border-t border-theme-border pt-6 mt-2">
                <div className="text-center p-4 bg-black/30 rounded-xl border border-theme-border-secondary">
                    <p className="text-theme-text-secondary text-sm mb-1">Fecha Estimada de Entrega</p>
                    <h3 className="text-3xl font-extrabold text-theme-success mb-2">
                        {result ? result.estimatedDate || '--' : '--'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">{result?.message || 'Calcula para ver resultados'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-700/50 pt-4">
                        <div>
                            <p className="text-xl font-bold text-theme-accent">{result ? `${result.hoursRemaining}h` : '--'}</p>
                            <p className="text-xs text-theme-text-secondary">Trabajo Restante</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-theme-accent">{result ? result.realPace : '--'}</p>
                            <p className="text-xs text-theme-text-secondary">Ritmo Real</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DeliveryEstimatorModal;