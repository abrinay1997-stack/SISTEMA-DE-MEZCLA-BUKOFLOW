import React, { useState, useRef } from 'react';
import type { Project, Step, SubStepFeedback, SubStep } from '../types';
import { StarIcon, StarFilledIcon, ChevronDownIcon, PlusIcon, TrashIcon, PencilIcon, QuestionMarkCircleIcon, PlanificationPatternIcon, BrandingPatternIcon, DistributionPatternIcon, MarketingPatternIcon, LaunchPatternIcon } from './icons';

// --- SubStepItem Component --- //
interface SubStepItemProps {
  subStep: SubStep;
  feedback: SubStepFeedback | undefined;
  onUpdateFeedback: (id: string, feedback: Partial<SubStepFeedback>) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, newText: string) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onOpenGuide: (guide: 'marketing' | 'branding') => void;
}

const SubStepItem: React.FC<SubStepItemProps> = ({ 
    subStep, feedback, onUpdateFeedback, onDelete, onUpdateText,
    onDragStart, onDragOver, onDrop, onOpenGuide
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(feedback?.userNotes || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(subStep.text);

    const notesTimeoutRef = useRef<number | null>(null);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
        notesTimeoutRef.current = window.setTimeout(() => onUpdateFeedback(subStep.id, { userNotes: e.target.value }), 500);
    };

    const handleSaveEdit = () => {
        if (editText.trim() !== subStep.text) onUpdateText(subStep.id, editText.trim());
        setIsEditing(false);
    };

    return (
        <li 
            className="group flex flex-col gap-2 bg-black/20 p-3 rounded-md border border-theme-border"
            draggable
            onDragStart={(e) => onDragStart(e, subStep.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, subStep.id)}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-start space-x-4 flex-grow">
                    <div
                        onClick={() => onUpdateFeedback(subStep.id, { completed: !feedback?.completed })}
                        className={`flex-shrink-0 w-6 h-6 mt-1 rounded border-2 bg-black/30 flex items-center justify-center transition-all duration-200 cursor-pointer ${feedback?.completed ? 'border-theme-success bg-theme-success/30' : 'border-theme-border hover:bg-theme-accent-secondary/20'}`}
                    >
                        {feedback?.completed && <span className="w-3 h-3 rounded-sm bg-theme-success animate-pop-in" />}
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-2">
                        {isEditing ? (
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveEdit()}
                                className="w-full p-1 bg-theme-bg border border-theme-accent rounded-md text-sm text-theme-text"
                                autoFocus
                            />
                        ) : (
                            <div className="flex-grow flex items-center gap-2">
                                <span className={`text-sm md:text-base transition-all duration-300 ${feedback?.completed ? 'text-theme-text-secondary line-through' : 'text-theme-text'}`}>
                                    {subStep.text}
                                </span>
                                {subStep.guideLink && (
                                    <button onClick={() => onOpenGuide(subStep.guideLink)} className="flex-shrink-0 p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-accent transition-colors" aria-label="Abrir guía">
                                        <QuestionMarkCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        {subStep.subItems && <ul className="pl-5 mt-2 space-y-1 list-disc text-xs md:text-sm text-theme-text-secondary">{subStep.subItems.map((item, index) => <li key={index}>{item.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-theme-accent">{part}</strong> : part)}</li>)}</ul>}
                    </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 gap-1">
                        <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full hover:bg-white/10 text-theme-text-secondary"><PencilIcon className="w-4 h-4" /></button>
                        {subStep.isCustom && <button onClick={() => onDelete(subStep.id)} className="p-1.5 rounded-full hover:bg-white/10 text-theme-text-secondary"><TrashIcon className="w-4 h-4" /></button>}
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-full hover:bg-white/10 text-theme-text-secondary"><ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                </div>
            </div>
            {isExpanded && <div className="pl-10 pr-4 pt-2 border-t border-theme-border/50 animate-fade-in-step space-y-3">
                <div>
                    <label className="text-xs font-semibold text-theme-text-secondary block mb-1">Mis Anotaciones</label>
                    <textarea value={notes} onChange={handleNotesChange} placeholder="Añade tus notas personales aquí..." className="w-full h-24 p-2 bg-theme-bg/80 border border-theme-border rounded-md text-sm text-theme-text focus:ring-1 focus:ring-theme-accent-secondary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-theme-text-secondary block mb-1">Dificultad de la Tarea</label>
                    {/* FIX: Changed onUpdateSubStep to onUpdateFeedback as it is the correct prop name for this action. */}
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => onUpdateFeedback(subStep.id, { difficulty: star as SubStepFeedback['difficulty'] })}>{(feedback?.difficulty || 0) >= star ? <StarFilledIcon className="w-5 h-5 text-theme-priority" /> : <StarIcon className="w-5 h-5 text-theme-text-secondary hover:text-theme-priority" />}</button>)}</div>
                </div>
            </div>}
        </li>
    );
};

// --- StepView Component --- //
interface StepViewProps {
  steps: Step[];
  subStepFeedback: Map<string, SubStepFeedback>;
  currentStepId: number;
  dateRange: string;
  onUpdateSubStep: (id: string, feedback: Partial<SubStepFeedback>) => void;
  onStepsUpdate: (updatedSteps: Step[]) => void;
  onOpenMarketingGuide: () => void;
  onOpenBrandingGuide: () => void;
}

const categoryPatterns: { [key: string]: React.FC<{ className?: string }> } = {
    'Planificación': PlanificationPatternIcon,
    'Branding': BrandingPatternIcon,
    'Distribución': DistributionPatternIcon,
    'Marketing': MarketingPatternIcon,
    'Lanzamiento': LaunchPatternIcon,
};

const StepView: React.FC<StepViewProps> = ({
  steps,
  subStepFeedback,
  currentStepId,
  dateRange,
  onUpdateSubStep,
  onStepsUpdate,
  onOpenBrandingGuide,
  onOpenMarketingGuide,
}) => {
  const step = steps.find(s => s.id === currentStepId);
  const [newSubStepText, setNewSubStepText] = useState('');
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  if (!step) return null;

  const handleSubStepUpdate = (updatedSubSteps: SubStep[]) => {
    const newSteps = steps.map(s => s.id === currentStepId ? { ...s, subSteps: updatedSubSteps } : s);
    onStepsUpdate(newSteps);
  };
  
  const handleAddSubStep = () => {
    if (newSubStepText.trim()) {
        const newSubStep: SubStep = { id: crypto.randomUUID(), text: newSubStepText.trim(), isCustom: true };
        handleSubStepUpdate([...step.subSteps, newSubStep]);
        setNewSubStepText('');
    }
  };

  const handleDeleteSubStep = (id: string) => handleSubStepUpdate(step.subSteps.filter(ss => ss.id !== id));
  const handleUpdateSubStepText = (id: string, newText: string) => handleSubStepUpdate(step.subSteps.map(ss => ss.id === id ? { ...ss, text: newText } : ss));

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => { dragItem.current = id; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    dragOverItem.current = id;
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
        const newSubSteps = [...step.subSteps];
        const dragItemIndex = newSubSteps.findIndex(ss => ss.id === dragItem.current);
        const dragOverItemIndex = newSubSteps.findIndex(ss => ss.id === dragOverItem.current);
        const [reorderedItem] = newSubSteps.splice(dragItemIndex, 1);
        newSubSteps.splice(dragOverItemIndex, 0, reorderedItem);
        handleSubStepUpdate(newSubSteps);
    }
    dragItem.current = null; dragOverItem.current = null;
  };

  const handleOpenGuide = (guide: 'marketing' | 'branding') => {
    if (guide === 'marketing') {
      onOpenMarketingGuide();
    } else if (guide === 'branding') {
      onOpenBrandingGuide();
    }
  };

  const Pattern = categoryPatterns[step.category];
  
  return (
    <>
      <div className="relative bg-theme-bg-secondary backdrop-blur-md border rounded-lg p-6 md:p-8 flex flex-col transition-all duration-300 w-full max-w-4xl border-theme-border shadow-accent-secondary overflow-hidden">
        {Pattern && <Pattern className="absolute top-0 right-0 h-48 w-48 text-theme-border opacity-5" />}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4"><div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-theme-accent-secondary flex items-center justify-center text-2xl md:text-3xl font-bold bg-black/50">{step.id}</div><div><h3 className="text-base md:text-lg font-bold text-theme-accent uppercase tracking-widest">{step.title}</h3><p className="text-sm md:text-base text-theme-accent-secondary">{step.subtitle}</p>{dateRange && <p className="text-xs text-theme-accent font-mono mt-1">{dateRange}</p>}</div></div>
        </div>
        <div className="flex-grow my-6 space-y-6">
          {step.philosophy && <div><h4 className="text-md font-semibold text-theme-accent mb-2 uppercase tracking-wider">Filosofía:</h4><p className="text-theme-text italic text-sm md:text-base leading-relaxed">{step.philosophy}</p></div>}
          {step.method && <div><h4 className="text-md font-semibold text-theme-accent mb-2 uppercase tracking-wider">Método:</h4><p className="text-theme-text text-sm md:text-base leading-relaxed">{step.method}</p></div>}
          <div>
              <h4 className="text-md font-semibold text-theme-text mb-4 border-b-2 border-theme-border-secondary pb-2 uppercase tracking-wider">Lista de Tareas:</h4>
              <ul className="space-y-3">
                {step.subSteps.map((subStep) => (
                    <SubStepItem key={subStep.id} subStep={subStep} feedback={subStepFeedback.get(subStep.id)} onUpdateFeedback={onUpdateSubStep} onDelete={handleDeleteSubStep} onUpdateText={handleUpdateSubStepText} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onOpenGuide={handleOpenGuide} />
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                  <input type="text" value={newSubStepText} onChange={(e) => setNewSubStepText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubStep()} placeholder="Añadir una nueva tarea personalizada..." className="flex-grow bg-theme-bg/80 border border-theme-border rounded-md text-sm text-theme-text p-2 focus:ring-1 focus:ring-theme-accent-secondary focus:outline-none"/>
                  <button onClick={handleAddSubStep} className="flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-md font-semibold bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30"><PlusIcon className="w-5 h-5"/> Añadir</button>
              </div>
          </div>
          {step.note && <div className="mt-6 p-4 bg-theme-accent-secondary/20 border-l-4 border-theme-accent-secondary rounded-r-md"><h4 className="text-md font-semibold text-theme-accent-secondary mb-2 uppercase tracking-wider">Nota Importante:</h4><p className="text-theme-text text-sm md:text-base leading-relaxed">{step.note}</p></div>}
        </div>
      </div>
    </>
  );
};

export default StepView;