import React, { useState, useMemo, useEffect } from 'react';
import { performSearch } from '../services/searchService';
import type { Project, Step, Resource, SearchResult } from '../types';
import { XIcon, SearchIcon, BookOpenIcon, SlidersIcon, ReverbIcon, SaturationIcon, QuestionMarkCircleIcon } from './icons';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProjectAndStep: (projectId: string, stepIndex: number) => void;
  onOpenEQGuide: () => void;
  onOpenCompressionGuide: () => void;
  onOpenReverbGuide: () => void;
  onOpenSaturationGuide: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ 
    isOpen, 
    onClose,
    projects,
    onSelectProjectAndStep,
    onOpenEQGuide,
    onOpenCompressionGuide,
    onOpenReverbGuide,
    onOpenSaturationGuide
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [stepToSelect, setStepToSelect] = useState<Step | null>(null);

  useEffect(() => {
    if (!isOpen) {
        // Reset state on close
        setTimeout(() => {
            setSearchTerm('');
            setResults(null);
            setStepToSelect(null);
        }, 300); // Wait for animation
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (searchTerm.trim().length > 2) {
            setResults(performSearch(searchTerm));
        } else {
            setResults(null);
        }
    }, 300); // Debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  const handleGuideClick = (guide: 'eq' | 'compression' | 'reverb' | 'saturation') => {
    onClose();
    switch (guide) {
        case 'eq': onOpenEQGuide(); break;
        case 'compression': onOpenCompressionGuide(); break;
        case 'reverb': onOpenReverbGuide(); break;
        case 'saturation': onOpenSaturationGuide(); break;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-start justify-center z-50 p-4 pt-[10vh] animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 border-b border-theme-border-secondary relative">
            <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar 'sidechain', 'resonancia', etc."
                autoFocus
                className="w-full pl-10 pr-4 py-2 text-lg bg-theme-bg border-2 border-theme-border rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
            <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full text-theme-text-secondary hover:bg-white/10">
                <XIcon className="w-6 h-6"/>
            </button>
        </div>

        <div className="flex-grow p-4 overflow-auto">
            {!results && searchTerm.length > 2 && <p className="text-center text-theme-text-secondary">Buscando...</p>}
            {!results && searchTerm.length <= 2 && <p className="text-center text-theme-text-secondary">Escribe al menos 3 caracteres para buscar.</p>}
            
            {results && (results.steps.length + results.guides.length + results.faqs.length) === 0 && (
                <p className="text-center text-theme-text-secondary">No se encontraron resultados para "{searchTerm}".</p>
            )}

            {results && results.steps.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold text-theme-accent-secondary mb-2">Pasos de Mezcla</h3>
                    <ul className="space-y-2">
                        {results.steps.map(step => (
                            <li key={step.id}>
                                <button onClick={() => setStepToSelect(step)} className="w-full text-left p-3 rounded-md bg-black/20 hover:bg-theme-accent-secondary/10 transition-colors">
                                    <span className="font-semibold text-theme-text">{step.id}. {step.title}</span>
                                    <p className="text-xs text-theme-text-secondary">{step.subtitle}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {results && results.guides.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold text-theme-accent-secondary mb-2">Guías Profesionales</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {results.guides.map(guide => (
                             <button key={guide.guide} onClick={() => handleGuideClick(guide.guide)} className="w-full text-left p-3 rounded-md bg-black/20 hover:bg-theme-accent-secondary/10 transition-colors flex items-center gap-3">
                                {guide.guide === 'eq' && <BookOpenIcon className="w-5 h-5 text-fuchsia-400" />}
                                {guide.guide === 'compression' && <SlidersIcon className="w-5 h-5 text-sky-400" />}
                                {guide.guide === 'reverb' && <ReverbIcon className="w-5 h-5 text-purple-400" />}
                                {guide.guide === 'saturation' && <SaturationIcon className="w-5 h-5 text-amber-400" />}
                                <span className="font-semibold text-theme-text">Guía de {guide.term}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

             {results && results.faqs.length > 0 && (
                <div>
                    <h3 className="font-bold text-theme-accent-secondary mb-2">Preguntas Frecuentes</h3>
                     <ul className="space-y-2">
                        {results.faqs.map(faq => (
                             <div key={faq.id} className="w-full p-3 rounded-md bg-black/20 flex items-start gap-3">
                                <QuestionMarkCircleIcon className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-theme-text">{faq.title}</span>
                                    <p className="text-xs text-theme-text-secondary">{faq.description}</p>
                                </div>
                            </div>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>

      {/* Project Selector Modal */}
      {stepToSelect && (
        <div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
            onClick={() => setStepToSelect(null)}
        >
             <div
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg shadow-secondary-lg w-full max-w-md flex flex-col animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="p-4 font-bold text-theme-accent-secondary border-b border-theme-border">Abrir "{stepToSelect.title}" en...</h3>
                <div className="p-2 max-h-64 overflow-y-auto">
                    {projects.map(project => (
                        <button 
                            key={project.id}
                            onClick={() => onSelectProjectAndStep(project.id, stepToSelect.id - 1)}
                            className="w-full text-left p-3 rounded-md hover:bg-white/10"
                        >
                            {project.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchModal;
