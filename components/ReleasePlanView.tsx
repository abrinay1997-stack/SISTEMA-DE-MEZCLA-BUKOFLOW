import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Project, SubStepFeedback, Step } from '../types';
import StepView from './StepView';
import ProgressBar from './ProgressBar';
import Sidebar from './Sidebar';
import CompletionView from './CompletionView';
import ToastNotification from './ToastNotification';
import ResourcePanel from './ResourcePanel';
import FinanceTracker from './FinanceTracker';
import ActivityLog from './ActivityLog';
import AudienceIntelligenceModal from './AudienceIntelligenceModal';
import { ArrowLeftIcon, HamburgerIcon, QuestionMarkCircleIcon, ClipboardListIcon, TrendingUpIcon, ChatBubbleIcon, MarketingIcon, BrandingIcon } from './icons';

type ActiveTab = 'checklist' | 'finance' | 'activity';

interface ReleasePlanViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onGoToHub: () => void;
    onOpenMarketingGuide: () => void;
    onOpenBrandingGuide: () => void;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
    initialStepIndex: number | null;
    onClearInitialStep: () => void;
}

const calculateDateForStep = (releaseDateStr: string, stepId: number): string => {
    if (!releaseDateStr) return '';
    const releaseDate = new Date(`${releaseDateStr}T00:00:00`);
    if (isNaN(releaseDate.getTime())) return '';

    const weeksBefore = 7 - stepId;
    if (weeksBefore > 0) {
        const weekStartDate = new Date(releaseDate);
        weekStartDate.setDate(releaseDate.getDate() - (weeksBefore * 7));
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
        const startStr = weekStartDate.toLocaleDateString('es-ES', options);
        const endStr = weekEndDate.toLocaleDateString('es-ES', options);
        return `(Semana del ${startStr} al ${endStr})`;
    }
    if (stepId === 7) {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        return `(A partir del ${releaseDate.toLocaleDateString('es-ES', options)})`;
    }
    return '';
};

const ReleasePlanView: React.FC<ReleasePlanViewProps> = ({ 
    project, onUpdateProject, onGoToHub, favorites, onToggleFavorite, initialStepIndex, onClearInitialStep,
    onOpenBrandingGuide, onOpenMarketingGuide
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex ?? project.lastStepIndex ?? 0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('checklist');
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);

  useEffect(() => {
    if (initialStepIndex !== null) onClearInitialStep();
  }, [initialStepIndex, onClearInitialStep]);

  useEffect(() => {
    if (project.lastStepIndex !== currentStepIndex) {
      onUpdateProject({ ...project, lastStepIndex: currentStepIndex });
    }
  }, [currentStepIndex, onUpdateProject, project]);

  const totalSubSteps = useMemo(() => project.steps.reduce((count, step) => count + step.subSteps.length, 0), [project.steps]);
  
  const { progress, isCompleted } = useMemo(() => {
    const feedbackMap = new Map<string, SubStepFeedback>(project.subStepFeedback as any);
    const completedCount = Array.from(feedbackMap.values()).filter(f => f.completed).length;
    const progress = totalSubSteps > 0 ? (completedCount / totalSubSteps) * 100 : 0;
    return { progress, isCompleted: totalSubSteps > 0 && completedCount === totalSubSteps };
  }, [project.subStepFeedback, totalSubSteps]);

  const handleUpdateSubStep = useCallback((subStepId: string, feedbackUpdate: Partial<SubStepFeedback>) => {
    const newFeedbackMap = new Map<string, SubStepFeedback>(project.subStepFeedback as any);
    const currentFeedback = newFeedbackMap.get(subStepId);
    const updatedFeedback: SubStepFeedback = { ...(currentFeedback || { completed: false }), ...feedbackUpdate };
    newFeedbackMap.set(subStepId, updatedFeedback);

    if ('completed' in feedbackUpdate) {
        const stepOfToggled = project.steps.find(s => s.subSteps.some(ss => ss.id === subStepId));
        if (stepOfToggled) {
            const allIdsInCategory = project.steps.filter(s => s.category === stepOfToggled.category).flatMap(s => s.subSteps.map(ss => ss.id));
            const wasComplete = allIdsInCategory.every(id => project.subStepFeedback.get(id)?.completed);
            const isCompleteNow = allIdsInCategory.every(id => newFeedbackMap.get(id)?.completed);
            if (!wasComplete && isCompleteNow) {
                 const messages: Record<string, string> = { 'Planificación': '¡Bases sentadas!', 'Branding': '¡Identidad definida!', 'Distribución': '¡Música en camino!', 'Marketing': '¡El Hype es real!', 'Lanzamiento': '¡Tu música está en el mundo!' };
                 setToast({ title: '¡Hito Alcanzado!', message: messages[stepOfToggled.category] || `Categoría "${stepOfToggled.category}" completada!` });
            }
        }
    }
    onUpdateProject({ ...project, subStepFeedback: newFeedbackMap });
  }, [project, onUpdateProject]);

  const handleProjectStepsUpdate = (updatedSteps: Step[]) => {
    const allCurrentSubStepIds = new Set(updatedSteps.flatMap(step => step.subSteps.map(subStep => subStep.id)));
    const newFeedbackMap = new Map<string, SubStepFeedback>(project.subStepFeedback as any);

    for (const key of newFeedbackMap.keys()) {
        if (!allCurrentSubStepIds.has(key)) {
            newFeedbackMap.delete(key);
        }
    }
    
    onUpdateProject({ ...project, steps: updatedSteps, subStepFeedback: newFeedbackMap });
  };
  
  const currentStepData = project.steps[currentStepIndex];
  const dateRange = project.releaseDate ? calculateDateForStep(project.releaseDate, currentStepData.id) : '';
  const stepsWithDates = useMemo(() => project.steps.map(step => ({ ...step, dateRange: project.releaseDate ? calculateDateForStep(project.releaseDate, step.id) : '' })), [project.steps, project.releaseDate]);

  const TABS: { id: ActiveTab, name: string, icon: React.FC<{className?:string}> }[] = [
    { id: 'checklist', name: 'Checklist', icon: ClipboardListIcon },
    { id: 'finance', name: 'Finanzas', icon: TrendingUpIcon },
    { id: 'activity', name: 'Actividad', icon: ChatBubbleIcon },
  ];

  return (
    <div className="min-h-screen bg-theme-bg bg-cover bg-fixed background-grid">
      {toast && <ToastNotification title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
      <ResourcePanel isOpen={isResourcePanelOpen} onClose={() => setIsResourcePanelOpen(false)} currentStep={currentStepData} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      <AudienceIntelligenceModal isOpen={isIntelligenceOpen} onClose={() => setIsIntelligenceOpen(false)} project={project} />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-center mb-8 md:mb-12 relative">
          <div className="flex-1"><button onClick={onGoToHub} className="flex items-center gap-2 py-2 px-4 rounded-md font-semibold transition-all duration-300 bg-theme-accent-secondary/20 text-theme-accent-secondary hover:bg-theme-accent-secondary/30"><ArrowLeftIcon className="w-5 h-5"/><span className="hidden sm:inline">Volver al Hub</span></button></div>
          <div className="flex-1 flex justify-center"><div className="flex items-center gap-4"><img alt="Logo" className="w-12 h-auto md:w-16 md:h-auto filter drop-shadow-[0_0_8px_var(--theme-accent)]" src="https://hostedimages-cdn.aweber-static.com/MjM0MTQ0NQ==/thumbnail/188302f5ca5241bd9111d44862883f63.png" /><div><h1 className="text-xl md:text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase text-center">Ruta del Lanzamiento</h1><p className="hidden md:block text-sm md:text-lg text-theme-accent text-center">{project.name}</p></div></div></div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <button onClick={() => setIsResourcePanelOpen(true)} className="p-2 rounded-full text-theme-accent-secondary hover:bg-theme-accent-secondary/30 transition-colors"><QuestionMarkCircleIcon className="w-7 h-7" /></button>
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-full text-theme-accent-secondary hover:bg-theme-accent-secondary/30 transition-colors"><HamburgerIcon className="w-6 h-6" /></button>
          </div>
        </header>
        <p className="md:hidden text-center text-lg text-theme-accent mb-4 -mt-4">{project.name}</p>

        <div className="mb-8"><ProgressBar progress={progress} /></div>

        <div className="max-w-4xl mx-auto mb-8 w-full animate-fade-in-step" style={{ animationDelay: '100ms' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                  onClick={onOpenMarketingGuide}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-border text-theme-accent hover:bg-theme-accent/10 hover:shadow-lg hover:shadow-theme-accent/20 transform hover:-translate-y-1"
              >
                  <MarketingIcon className="w-8 h-8" />
                  <span className="text-sm text-center">Guía de Plan de Marketing</span>
              </button>
              <button
                  onClick={onOpenBrandingGuide}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-border text-theme-accent-secondary hover:bg-theme-accent-secondary/10 hover:shadow-lg hover:shadow-theme-accent-secondary/20 transform hover:-translate-y-1"
              >
                  <BrandingIcon className="w-8 h-8" />
                  <span className="text-sm text-center">Guía de Branding de Artista</span>
              </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar stepsWithDates={stepsWithDates} currentStepIndex={currentStepIndex} onSelectStep={(index) => { setCurrentStepIndex(index); setIsSidebarOpen(false); setActiveTab('checklist'); }} project={project} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-grow flex flex-col items-center gap-4 w-full lg:w-2/3 xl:w-3/4">
            <div className="w-full max-w-4xl bg-theme-bg-secondary/80 backdrop-blur-md border border-theme-border rounded-lg p-2 mb-4">
                <div className="flex items-center justify-around">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-text-secondary hover:bg-white/10'}`}>
                            <tab.icon className="w-5 h-5"/>
                            <span className="hidden sm:inline">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {isCompleted && activeTab === 'checklist' ? <CompletionView onGoToHub={onGoToHub} /> : (
              <div className="w-full max-w-4xl">
                {activeTab === 'checklist' && currentStepData && (
                  <>
                    <div className="animate-fade-in-step" key={currentStepData.id}>
                       <StepView
                          steps={project.steps}
                          subStepFeedback={project.subStepFeedback}
                          currentStepId={currentStepData.id}
                          dateRange={dateRange}
                          onUpdateSubStep={handleUpdateSubStep}
                          onStepsUpdate={handleProjectStepsUpdate}
                          onOpenMarketingGuide={onOpenMarketingGuide}
                          onOpenBrandingGuide={onOpenBrandingGuide}
                        />
                    </div>
                    <div className="flex justify-between items-center w-full mt-4">
                        <button onClick={() => setCurrentStepIndex(p => Math.max(p - 1, 0))} disabled={currentStepIndex === 0} className="py-2 px-6 rounded-md font-semibold transition-all duration-300 bg-theme-accent-secondary/20 text-theme-accent-secondary hover:enabled:bg-theme-accent-secondary/30 disabled:opacity-50">‹ Anterior</button>
                        <div className="text-sm text-theme-text-secondary font-medium">Paso {currentStepIndex + 1} de {project.steps.length}</div>
                        <button onClick={() => setCurrentStepIndex(p => Math.min(p + 1, project.steps.length - 1))} disabled={currentStepIndex === project.steps.length - 1} className="py-2 px-6 rounded-md font-semibold transition-all duration-300 bg-theme-accent/20 text-theme-accent hover:enabled:bg-theme-accent/30 disabled:opacity-50">Siguiente ›</button>
                    </div>
                  </>
                )}
                {activeTab === 'finance' && <FinanceTracker project={project} onUpdateProject={onUpdateProject} />}
                {activeTab === 'activity' && <ActivityLog project={project} onUpdateProject={onUpdateProject} />}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ReleasePlanView;