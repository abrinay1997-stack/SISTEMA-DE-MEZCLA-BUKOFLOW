
import React, { useState, useMemo, useEffect } from 'react';
import { resourceData } from '../data/resourceData';
import type { Resource, Step } from '../types';
import { 
    XIcon, StarIcon, StarFilledIcon, PlayIcon, DownloadIcon, ChatBubbleIcon, QuestionMarkCircleIcon, ClockIcon
} from './icons';

// --- Resource Card Sub-component --- //
interface ResourceCardProps {
    resource: Resource;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    onOpenTutorial: (url: string, title: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isFavorite, onToggleFavorite, onOpenTutorial }) => {
    const renderIcon = () => {
        switch (resource.type) {
            case 'video': return <PlayIcon className="w-5 h-5 text-theme-accent-secondary" />;
            case 'community': return <ChatBubbleIcon className="w-5 h-5 text-green-400" />;
            case 'download': return <DownloadIcon className="w-5 h-5 text-theme-accent" />;
            case 'faq': return <QuestionMarkCircleIcon className="w-5 h-5 text-indigo-400" />;
            default: return null;
        }
    };

    const handleAction = () => {
        if (resource.type === 'video') {
            onOpenTutorial(resource.url, resource.title);
        } else if (resource.type !== 'faq') { // Prevent click for faq
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="group flex justify-between items-start gap-3 p-3 rounded-lg bg-black/30 border border-theme-border hover:bg-white/5 transition-colors">
            <div 
                className={`flex items-start gap-3 flex-grow ${resource.type !== 'faq' ? 'cursor-pointer' : ''}`}
                onClick={handleAction}
            >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 mt-1">{renderIcon()}</div>
                <div className="flex-grow">
                    <h4 className="font-semibold text-sm text-theme-text">{resource.title}</h4>
                    <p className="text-xs text-theme-text-secondary">{resource.description}</p>
                </div>
            </div>
            <button onClick={() => onToggleFavorite(resource.id)} className="p-2 rounded-full hover:bg-white/10 mt-1" aria-label="Marcar como favorito">
                {isFavorite ? <StarFilledIcon className="w-5 h-5 text-theme-priority" /> : <StarIcon className="w-5 h-5 text-theme-text-secondary group-hover:text-theme-priority transition-colors" />}
            </button>
        </div>
    );
};


// --- Main Resource Panel Component --- //
interface ResourcePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: Step | null;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenTutorial: (url: string, title: string) => void;
  onOpenEstimator: () => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ isOpen, onClose, currentStep, favorites, onToggleFavorite, onOpenTutorial, onOpenEstimator }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Scroll Lock
  useEffect(() => {
    if (isOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const relevantResources = useMemo(() => {
    if (!currentStep) return [];
    
    let resources = resourceData.filter(r => r.relatedSteps?.includes(currentStep.id));

    if (searchTerm.trim() !== '') {
        const lowercasedFilter = searchTerm.toLowerCase();
        resources = resources.filter(r => 
            r.title.toLowerCase().includes(lowercasedFilter) ||
            r.description.toLowerCase().includes(lowercasedFilter) ||
            r.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
        );
    }
    return resources;
  }, [currentStep, searchTerm]);
  
  const favoriteResources = useMemo(() => {
    let resources = resourceData.filter(r => favorites.has(r.id));
    if (searchTerm.trim() !== '') {
        const lowercasedFilter = searchTerm.toLowerCase();
        resources = resources.filter(r => 
            r.title.toLowerCase().includes(lowercasedFilter) ||
            r.description.toLowerCase().includes(lowercasedFilter) ||
            r.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
        );
    }
    return resources;
  }, [favorites, searchTerm]);

  return (
    <div className={`fixed inset-0 z-40 lg:z-50 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div 
            className={`relative h-full transition-transform duration-300 ease-in-out bg-theme-bg-secondary w-full max-w-md flex flex-col border-l border-theme-border-secondary ml-auto pt-safe pb-safe ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-theme-border">
                <h2 className="text-lg font-bold text-theme-accent">Recursos de Ayuda</h2>
                <button onClick={onClose} className="p-4 rounded-full hover:bg-white/10">
                    <XIcon className="w-6 h-6 text-theme-text-secondary"/>
                </button>
            </header>
            
            <div className="flex-shrink-0 p-4 border-b border-theme-border space-y-4">
                 {/* Tools Section */}
                <button
                    onClick={onOpenEstimator}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-theme-success/20 text-theme-success border border-theme-success/30 hover:bg-theme-success/30 transition-all font-semibold"
                >
                    <ClockIcon className="w-5 h-5" />
                    Proyección de Entrega
                </button>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en todos los recursos..."
                    className="w-full pl-4 pr-4 py-2 bg-theme-bg border border-theme-border-secondary rounded-md text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
            </div>

            <main className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {currentStep && relevantResources.length > 0 && (
                    <section>
                        <h3 className="font-semibold text-theme-accent-secondary mb-3">Recomendado para: <span className="text-theme-text">{currentStep.title}</span></h3>
                        <div className="space-y-2">
                            {relevantResources.map(res => (
                                <ResourceCard 
                                    key={res.id} 
                                    resource={res} 
                                    isFavorite={favorites.has(res.id)} 
                                    onToggleFavorite={onToggleFavorite} 
                                    onOpenTutorial={onOpenTutorial} 
                                />
                            ))}
                        </div>
                    </section>
                )}
                
                <section>
                    <h3 className="font-semibold text-theme-priority mb-3">⭐ Tus Favoritos</h3>
                    {favoriteResources.length > 0 ? (
                         <div className="space-y-2">
                            {favoriteResources.map(res => (
                                <ResourceCard 
                                    key={res.id} 
                                    resource={res} 
                                    isFavorite={true} 
                                    onToggleFavorite={onToggleFavorite} 
                                    onOpenTutorial={onOpenTutorial} 
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-theme-text-secondary italic p-4 bg-black/20 rounded-md">
                            No tienes favoritos. Haz clic en la estrella (⭐) en cualquier recurso para guardarlo aquí.
                        </p>
                    )}
                </section>
                 {(relevantResources.length === 0 && favoriteResources.length === 0 && searchTerm) && (
                     <div className="text-center py-8">
                        <p className="text-theme-text-secondary">No se encontraron resultados para "{searchTerm}".</p>
                    </div>
                 )}
            </main>
        </div>
    </div>
  );
};

export default ResourcePanel;
