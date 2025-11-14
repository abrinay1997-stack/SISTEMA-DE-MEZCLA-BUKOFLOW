import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MIXING_STEPS } from '../constants';
import type { Project } from '../types';
import StepView from './StepCard';
import ProgressBar from './ProgressBar';
import Sidebar from './Sidebar';
import CompletionView from './CompletionView';
import ToastNotification from './ToastNotification';
import VideoTutorialModal from './VideoTutorialModal';
import ResourcePanel from './ResourcePanel';
import { LogoIcon, ArrowLeftIcon, HamburgerIcon, QuestionMarkCircleIcon } from './icons';

interface MixingViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onGoToHub: () => void;
    onOpenEQGuide: () => void;
    onOpenCompressionGuide: () => void;
    onOpenReverbGuide: () => void;
    onOpenSaturationGuide: () => void;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
}

const MixingView: React.FC<MixingViewProps> = ({ 
    project, 
    onUpdateProject, 
    onGoToHub,
    onOpenEQGuide,
    onOpenCompressionGuide,
    onOpenReverbGuide,
    onOpenSaturationGuide,
    favorites,
    onToggleFavorite
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(project.lastStepIndex || 0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [tutorialModalState, setTutorialModalState] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    // To prevent unnecessary updates, only call onUpdateProject if the index has actually changed
    // and differs from what's stored in the project object.
    if (project.lastStepIndex !== currentStepIndex) {
      onUpdateProject({ ...project, lastStepIndex: currentStepIndex });
    }
  }, [currentStepIndex, onUpdateProject, project]);

  const totalSubSteps = useMemo(() =>
    MIXING_STEPS.reduce((count, step) => count + step.subSteps.length, 0),
    []
  );

  const progress = useMemo(
    () => (totalSubSteps > 0 ? (project.completedSubSteps.size / totalSubSteps) * 100 : 0),
    [project.completedSubSteps.size, totalSubSteps]
  );

  const isCompleted = useMemo(
    () => totalSubSteps > 0 && project.completedSubSteps.size === totalSubSteps,
    [project.completedSubSteps.size, totalSubSteps]
  );

  const toggleSubStepCompletion = useCallback((subStepId: string) => {
    const oldCompletedSet = project.completedSubSteps;
    const newSet = new Set(oldCompletedSet);
    if (newSet.has(subStepId)) {
      newSet.delete(subStepId);
    } else {
      newSet.add(subStepId);
    }

    const stepOfToggledSubstep = MIXING_STEPS.find(s => s.subSteps.some(ss => ss.id === subStepId));
    
    if (stepOfToggledSubstep) {
        const category = stepOfToggledSubstep.category;
        
        const allSubstepIdsInCategory = MIXING_STEPS
            .filter(s => s.category === category)
            .flatMap(s => s.subSteps.map(ss => ss.id));
            
        const wasCategoryAlreadyComplete = allSubstepIdsInCategory.every(id => oldCompletedSet.has(id));
        
        const isCategoryCompleteNow = allSubstepIdsInCategory.every(id => newSet.has(id));

        if (!wasCategoryAlreadyComplete && isCategoryCompleteNow) {
            const categoryMessages: Record<string, string> = {
                'Concepto': '¡Enfoque definido! Ya tienes clara la emoción de tu canción.',
                'Fundamento': '¡Base sólida construida! Has preparado el terreno para una gran mezcla.',
                'Edición': '¡Limpieza finalizada! Tu proyecto suena profesional y sin ruidos.',
                'Pistas Individuales': '¡Pistas esculpidas! Cada sonido tiene su propio espacio y control.',
                'Creatividad': '¡Toque mágico añadido! Tu mezcla tiene movimiento y profundidad.',
                'Procesamiento de Grupos': '¡Grupos cohesionados! La mezcla empieza a sonar como una unidad.',
                'Verificación': '¡Prueba de fuego superada! Tu mezcla se defenderá en cualquier sistema.',
                'Entrega': '¡Listo para el mundo! Has preparado tu mezcla para la entrega final.'
            };
            const message = categoryMessages[category] || `¡Has completado todos los pasos de la categoría "${category}"!`;
            
            setToast({ title: '¡Hito Alcanzado!', message });
        }
    }

    onUpdateProject({ ...project, completedSubSteps: newSet });
  }, [project, onUpdateProject]);

  const goToNextStep = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, MIXING_STEPS.length - 1));
  };

  const goToPrevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };
  
  const handleOpenTutorial = useCallback((url: string, title: string) => {
    setTutorialModalState({ isOpen: true, url, title });
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setTutorialModalState({ isOpen: false, url: '', title: '' });
  }, []);

  const currentStepData = MIXING_STEPS[currentStepIndex];

  return (
    <div 
        className="min-h-screen bg-theme-bg bg-cover bg-fixed background-grid" 
    >
      {toast && <ToastNotification title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
      <VideoTutorialModal 
          isOpen={tutorialModalState.isOpen}
          onClose={handleCloseTutorial}
          videoUrl={tutorialModalState.url}
          title={tutorialModalState.title}
      />
      <ResourcePanel
        isOpen={isResourcePanelOpen}
        onClose={() => setIsResourcePanelOpen(false)}
        currentStep={currentStepData}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        onOpenTutorial={handleOpenTutorial}
      />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-center mb-8 md:mb-12 relative">
            <div className="flex-1">
                <button onClick={onGoToHub} className="flex items-center gap-2 py-2 px-4 rounded-md font-semibold transition-all duration-300 bg-theme-accent-secondary/20 text-theme-accent-secondary hover:bg-theme-accent-secondary/30">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">Volver al Hub</span>
                </button>
            </div>

            <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-4">
                    <LogoIcon className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase text-center">
                            Ruta del Viajero
                        </h1>
                        <p className="hidden md:block text-sm md:text-lg text-theme-accent text-center">{project.name}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-2">
                 <button onClick={() => setIsResourcePanelOpen(true)} className="p-2 rounded-full text-theme-accent-secondary hover:bg-theme-accent-secondary/30 transition-colors">
                    <QuestionMarkCircleIcon className="w-7 h-7" />
                </button>
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-full text-theme-accent-secondary hover:bg-theme-accent-secondary/30 transition-colors">
                    <HamburgerIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
        <p className="md:hidden text-center text-lg text-theme-accent mb-8 -mt-4">{project.name}</p>


        <div className="mb-8">
          <ProgressBar progress={progress} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <Sidebar
                currentStepIndex={currentStepIndex}
                onSelectStep={(index) => {
                    setCurrentStepIndex(index);
                    setIsSidebarOpen(false);
                }}
                project={project}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-grow flex flex-col items-center gap-4">
               {isCompleted ? (
                    <CompletionView onGoToHub={onGoToHub} />
                ) : (
                    <>
                        <div className="w-full max-w-4xl animate-fade-in-step" key={currentStepData.id}>
                            <StepView
                                step={currentStepData}
                                completedSubSteps={project.completedSubSteps}
                                onToggleSubStep={toggleSubStepCompletion}
                                onOpenEQGuide={onOpenEQGuide}
                                onOpenCompressionGuide={onOpenCompressionGuide}
                                onOpenReverbGuide={onOpenReverbGuide}
                                onOpenSaturationGuide={onOpenSaturationGuide}
                                onOpenTutorial={handleOpenTutorial}
                            />
                        </div>
                        <div className="flex justify-between items-center w-full max-w-4xl mt-4">
                            <button
                                onClick={goToPrevStep}
                                disabled={currentStepIndex === 0}
                                className="py-2 px-6 rounded-md font-semibold transition-all duration-300 bg-theme-accent-secondary/20 text-theme-accent-secondary hover:enabled:bg-theme-accent-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ‹ Anterior
                            </button>
                            <div className="text-sm text-theme-text-secondary font-medium">
                                Paso {currentStepIndex + 1} de {MIXING_STEPS.length}
                            </div>
                            <button
                                onClick={goToNextStep}
                                disabled={currentStepIndex === MIXING_STEPS.length - 1}
                                className="py-2 px-6 rounded-md font-semibold transition-all duration-300 bg-theme-accent/20 text-theme-accent hover:enabled:bg-theme-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente ›
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default MixingView;