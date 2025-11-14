import React from 'react';
import type { Step } from '../types';
import { CheckCircleIcon, BookOpenIcon, SlidersIcon, ReverbIcon, SaturationIcon, PlayIcon } from './icons';

interface StepViewProps {
  step: Step;
  completedSubSteps: Set<string>;
  onToggleSubStep: (id: string) => void;
  onOpenEQGuide: () => void;
  onOpenCompressionGuide: () => void;
  onOpenReverbGuide: () => void;
  onOpenSaturationGuide: () => void;
  onOpenTutorial: (url: string, title: string) => void;
}

const StepView: React.FC<StepViewProps> = ({ 
  step, 
  completedSubSteps, 
  onToggleSubStep, 
  onOpenEQGuide, 
  onOpenCompressionGuide,
  onOpenReverbGuide,
  onOpenSaturationGuide,
  onOpenTutorial
}) => {
  return (
    <div
      className={`relative bg-theme-bg-secondary backdrop-blur-md border rounded-lg p-6 md:p-8 flex flex-col transition-all duration-300 w-full max-w-4xl border-theme-border shadow-accent-secondary`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-theme-accent-secondary flex items-center justify-center text-2xl md:text-3xl font-bold bg-black/50">
            {step.id}
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-theme-accent uppercase tracking-widest">{step.title}</h3>
            <p className="text-sm md:text-base text-theme-accent-secondary">{step.subtitle}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow my-6 space-y-6">
        {step.philosophy && (
          <div>
            <h4 className="text-md font-semibold text-theme-accent mb-2 uppercase tracking-wider">Filosofía teórica:</h4>
            <p className="text-theme-text italic text-sm md:text-base leading-relaxed">{step.philosophy}</p>
          </div>
        )}

        {step.method && (
          <div>
            <h4 className="text-md font-semibold text-theme-accent mb-2 uppercase tracking-wider">Método:</h4>
            <p className="text-theme-text text-sm md:text-base leading-relaxed">{step.method}</p>
          </div>
        )}
        
        <div>
            <h4 className="text-md font-semibold text-theme-text mb-4 border-b-2 border-theme-border-secondary pb-2 uppercase tracking-wider">Lista de Tareas:</h4>
            <ul className="space-y-4">
            {step.subSteps.map((subStep) => {
                const isCompleted = completedSubSteps.has(subStep.id);
                return (
                <li key={subStep.id} className="group flex justify-between items-start gap-4">
                    <div className="flex items-start space-x-4 cursor-pointer flex-grow" onClick={() => onToggleSubStep(subStep.id)}>
                        <div
                        className={`flex-shrink-0 w-6 h-6 mt-1 rounded border-2 bg-black/30 flex items-center justify-center transition-all duration-200
                            ${isCompleted ? 'border-theme-success bg-theme-success/30' : 'border-theme-border hover:bg-theme-accent-secondary/20'}`}
                        aria-checked={isCompleted}
                        role="checkbox"
                        >
                        {isCompleted && <CheckCircleIcon className="w-5 h-5 text-theme-success animate-pop-in" />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm md:text-base transition-all duration-300 ${isCompleted ? 'text-theme-text-secondary line-through' : 'text-theme-text'}`}>
                          {subStep.text}
                          </span>
                           {subStep.subItems && (
                              <ul className="pl-5 mt-2 space-y-1">
                                  {subStep.subItems.map((item, index) => (
                                      <li key={index} className={`text-xs md:text-sm list-disc list-outside ml-4 transition-colors duration-300 ${isCompleted ? 'text-gray-600 line-through' : 'text-theme-accent-secondary/80'}`}>
                                          {item}
                                      </li>
                                  ))}
                              </ul>
                          )}
                        </div>
                    </div>
                    {subStep.tutorialUrl && (
                        <button 
                            onClick={() => onOpenTutorial(subStep.tutorialUrl!, subStep.text)}
                            className="flex-shrink-0 flex items-center gap-2 text-xs font-semibold py-1 px-2 rounded-md bg-theme-accent/10 text-theme-accent opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 border border-theme-accent/20 hover:bg-theme-accent/20"
                        >
                            <PlayIcon className="w-4 h-4" />
                            Tutorial
                        </button>
                    )}
                </li>
                );
            })}
            </ul>
        </div>

        {step.note && (
            <div className="mt-6 p-4 bg-theme-accent-secondary/20 border-l-4 border-theme-accent-secondary rounded-r-md">
                <h4 className="text-md font-semibold text-theme-accent-secondary mb-2 uppercase tracking-wider">Nota:</h4>
                <p className="text-theme-text text-sm md:text-base leading-relaxed">{step.note}</p>
            </div>
        )}
      </div>
      
      {(step.id === 1 || step.id === 2 || step.id === 3 || step.id === 4 || step.id === 5 || step.id === 6 || step.id === 7 || step.id === 8 || step.id === 8 || step.id === 9 || step.id === 10 || step.id === 11 || step.id === 12) && (
        <div className="mt-4 pt-6 border-t border-theme-border grid grid-cols-1 md:grid-cols-2 gap-4">
            {(step.id === 6 || step.id === 8 || step.id === 11 || step.id === 12) && (
                <button
                onClick={onOpenEQGuide}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:shadow-lg hover:shadow-fuchsia-500/30 transform hover:-translate-y-1"
                >
                <BookOpenIcon className="w-6 h-6" />
                Guía Pro de Ecualización
                </button>
            )}
             {(step.id === 7 || step.id === 11 || step.id === 12) && (
                <button
                onClick={onOpenCompressionGuide}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1"
                >
                <SlidersIcon className="w-6 h-6" />
                Guía Pro de Compresión
                </button>
            )}
            {(step.id === 9 || step.id === 10 || step.id === 11) && (
              <>
                <button
                  onClick={onOpenReverbGuide}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
                >
                  <ReverbIcon className="w-6 h-6" />
                  Guía Pro de Reverb
                </button>
                <button
                  onClick={onOpenSaturationGuide}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1"
                >
                  <SaturationIcon className="w-6 h-6" />
                  Guía Pro de Saturación
                </button>
              </>
            )}
        </div>
      )}

    </div>
  );
};

export default StepView;