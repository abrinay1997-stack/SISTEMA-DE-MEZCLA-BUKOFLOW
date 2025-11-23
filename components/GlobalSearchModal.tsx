
import React, { useState, useEffect } from 'react';
import { performSearch } from '../services/searchService';
import type { Project, Step, SearchResult } from '../types';
import { XIcon, SearchIcon, BookOpenIcon, SlidersIcon, ReverbIcon, SaturationIcon, QuestionMarkCircleIcon, WaveformIcon, UserVoiceIcon, GuitarPickIcon, PianoIcon, DrumIcon, HeadphonesIcon, WaveSineIcon } from './icons';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  default: WaveformIcon,
  vocals: UserVoiceIcon,
  guitar: GuitarPickIcon,
  keys: PianoIcon,
  drums: DrumIcon,
  mix: HeadphonesIcon,
  synth: WaveSineIcon,
};

const ProjectIcon = ({ icon, className }: { icon?: string, className?: string }) => {
    const Icon = iconMap[icon || 'default'] || WaveformIcon;
    return <Icon className={className} />;
};

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
  onOpenSaturationGuide,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ steps: [], guides: [], faqs: [] });
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ steps: [], guides: [], faqs: [] });
      setFilteredProjects([]);
      return;
    }

    const results = performSearch(searchTerm);
    setSearchResults(results);

    const lowerTerm = searchTerm.toLowerCase();
    const projectResults = projects.filter(p => p.name.toLowerCase().includes(lowerTerm));
    setFilteredProjects(projectResults);

  }, [searchTerm, projects]);

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleStepClick = (step: Step) => {
    if (projects.length === 0) return;
    // Sort by createdAt descending to get the latest project
    const sortedProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt);
    const targetProject = sortedProjects[0];
    onSelectProjectAndStep(targetProject.id, step.id - 1); 
    handleClose();
  };

  if (!isOpen) return null;

  const hasResults = filteredProjects.length > 0 || searchResults.steps.length > 0 || searchResults.guides.length > 0 || searchResults.faqs.length > 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-[100] p-4 pt-20 animate-fade-in-backdrop" onClick={handleClose}>
      <div 
        className="w-full max-w-3xl bg-theme-bg-secondary border border-theme-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-theme-border bg-black/20">
            <SearchIcon className="w-6 h-6 text-theme-accent-secondary mr-3" />
            <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar proyectos, guías, pasos, trucos..."
                className="flex-grow bg-transparent border-none outline-none text-xl text-theme-text placeholder-theme-text-secondary"
                autoFocus
            />
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-theme-text-secondary">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {!searchTerm && (
                <div className="text-center text-theme-text-secondary py-12">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Escribe para buscar en todo FLOW ACADEMY</p>
                </div>
            )}

            {searchTerm && !hasResults && (
                <div className="text-center text-theme-text-secondary py-12">
                    <p>No se encontraron resultados para "{searchTerm}"</p>
                </div>
            )}

            {hasResults && (
                <div className="space-y-6">
                    
                    {/* Projects */}
                    {filteredProjects.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-theme-accent-secondary uppercase tracking-wider mb-3 px-2">Proyectos</h3>
                            <div className="space-y-2">
                                {filteredProjects.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => { onSelectProjectAndStep(p.id, p.lastStepIndex); handleClose(); }}
                                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-theme-accent/10 border border-transparent hover:border-theme-accent/30 transition-all group"
                                    >
                                        <div className="p-2 rounded-full bg-black/40 text-theme-text-secondary group-hover:text-theme-accent">
                                            <ProjectIcon icon={p.icon} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-theme-text">{p.name}</p>
                                            <p className="text-xs text-theme-text-secondary">Último paso: {p.lastStepIndex + 1}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Guides */}
                    {searchResults.guides.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-theme-accent-secondary uppercase tracking-wider mb-3 px-2">Guías</h3>
                            <div className="space-y-2">
                                {searchResults.guides.map((g, idx) => {
                                    let icon = <BookOpenIcon className="w-5 h-5" />;
                                    let action = () => {};
                                    let color = 'text-gray-300';
                                    
                                    if (g.guide === 'eq') { icon = <BookOpenIcon className="w-5 h-5" />; action = onOpenEQGuide; color = 'text-fuchsia-400'; }
                                    if (g.guide === 'compression') { icon = <SlidersIcon className="w-5 h-5" />; action = onOpenCompressionGuide; color = 'text-cyan-400'; }
                                    if (g.guide === 'reverb') { icon = <ReverbIcon className="w-5 h-5" />; action = onOpenReverbGuide; color = 'text-purple-400'; }
                                    if (g.guide === 'saturation') { icon = <SaturationIcon className="w-5 h-5" />; action = onOpenSaturationGuide; color = 'text-amber-400'; }

                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => { action(); handleClose(); }}
                                            className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                        >
                                            <div className={`p-2 rounded-full bg-black/40 ${color}`}>
                                                {icon}
                                            </div>
                                            <p className="font-bold text-theme-text">Guía de {g.term}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Steps */}
                    {searchResults.steps.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-theme-accent-secondary uppercase tracking-wider mb-3 px-2">Pasos de Mezcla</h3>
                            <div className="space-y-2">
                                {searchResults.steps.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => handleStepClick(s)}
                                        className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                    >
                                        <div className="p-2 rounded-full bg-black/40 text-theme-text font-bold text-sm h-9 w-9 flex items-center justify-center shrink-0">
                                            {s.id}
                                        </div>
                                        <div>
                                            <p className="font-bold text-theme-text">{s.title}</p>
                                            <p className="text-xs text-theme-text-secondary">{s.subtitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* FAQs / Resources */}
                    {searchResults.faqs.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-theme-accent-secondary uppercase tracking-wider mb-3 px-2">Recursos y Preguntas</h3>
                            <div className="space-y-2">
                                {searchResults.faqs.map(r => (
                                    <a 
                                        key={r.id}
                                        href={r.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block w-full text-left flex items-start gap-3 p-3 rounded-lg bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                    >
                                        <div className="p-2 rounded-full bg-black/40 text-indigo-400 shrink-0">
                                            <QuestionMarkCircleIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-theme-text text-sm">{r.title}</p>
                                            <p className="text-xs text-theme-text-secondary line-clamp-2">{r.description}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
