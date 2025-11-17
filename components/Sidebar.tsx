import React from 'react';
import { MIXING_STEPS } from '../constants';
import type { Project, Step } from '../types';
import { CheckCircleIcon, XIcon } from './icons';

interface SidebarProps {
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStepIndex, onSelectStep, project, isOpen, onClose }) => {

  const groupedSteps = MIXING_STEPS.reduce((acc, step) => {
    const category = step.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(step);
    return acc;
  }, {} as Record<string, Step[]>);

  const renderNavContent = () => (
    <nav className="space-y-4">
        {Object.entries(groupedSteps).map(([category, stepsInCategory]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-theme-accent-secondary uppercase tracking-wider mb-2 px-2">{category}</h3>
            <ul className="space-y-1">
              {stepsInCategory.map((step) => {
                const isActive = currentStepIndex === (step.id - 1);
                const isCompleted = step.subSteps.every(subStep => project.subStepFeedback.get(subStep.id)?.completed);
                return (
                  <li key={step.id}>
                    <button
                      onClick={() => onSelectStep(step.id - 1)}
                      className={`w-full text-left p-2.5 rounded-md transition-colors text-sm flex items-center gap-3 ${isActive ? 'bg-theme-accent-secondary/20 text-theme-accent-secondary font-semibold' : 'text-theme-text-secondary hover:bg-white/10 hover:text-theme-text'}`}
                    >
                      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                        {isCompleted ? <CheckCircleIcon className="w-5 h-5 text-theme-success" /> : <span className="w-2 h-2 rounded-full bg-theme-accent-secondary/50"></span>}
                      </div>
                      <span className="flex-1">{step.id}. {step.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
  );

  return (
    <>
      {/* Mobile Sidebar (Overlay) */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
        <div className={`relative h-full transition-transform duration-300 ease-in-out bg-theme-bg-secondary backdrop-blur-md w-full max-w-xs flex flex-col p-4 border-r border-theme-border ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-theme-accent">Ruta de Mezcla</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                    <XIcon className="w-6 h-6 text-theme-text-secondary"/>
                </button>
            </div>
            <div className="overflow-y-auto flex-grow">
              {renderNavContent()}
            </div>
        </div>
      </div>

      {/* Desktop Sidebar (Static) */}
      <aside className="hidden lg:block lg:w-1/3 xl:w-1/4 flex-shrink-0 bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg lg:sticky lg:top-8 h-fit p-4">
        <h2 className="text-lg font-bold text-theme-accent mb-4 text-center">Ruta de Mezcla</h2>
        {renderNavContent()}
      </aside>
    </>
  );
};

export default Sidebar;
