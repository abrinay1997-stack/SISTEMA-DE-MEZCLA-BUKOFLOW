
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Project, Resource, SubStepFeedback } from '../types';
import { resourceData, resourceCategories } from '../data/resourceData';
import { themes, ThemeName } from '../themes';
import { 
    LogoIcon, StarIcon, StarFilledIcon, TrashIcon, PlusIcon, DotsVerticalIcon, XIcon, BookOpenIcon, SlidersIcon, ReverbIcon, SaturationIcon, CheckBadgeIcon, PencilIcon,
    WaveformIcon, UserVoiceIcon, GuitarPickIcon, PianoIcon, DrumIcon, HeadphonesIcon, WaveSineIcon,
    PlayIcon, DownloadIcon, CollectionIcon, ChatBubbleIcon, QuestionMarkCircleIcon, SearchIcon, ArrowUpTrayIcon, ClockIcon, MetronomeIcon, SpeakerWaveIcon, ScaleIcon, ChartBarIcon, HomeIcon
} from './icons';
import ProgressBar from './ProgressBar';
import { MIXING_STEPS } from '../constants';
import VideoTutorialModal from './VideoTutorialModal';
import DeliveryEstimatorModal from './DeliveryEstimatorModal';
import BPMCalculatorModal from './BPMCalculatorModal';
import AcousticsCheckModal from './AcousticsCheckModal';
import BlindTestModal from './BlindTestModal';
import ReferenceTracksModal from './ReferenceTracksModal';

type ResourceCategoryKey = keyof typeof resourceCategories;

// --- Resource Card Component (reusable) --- //
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
    
    const actionButton = () => {
        const commonClasses = "flex-shrink-0 flex items-center gap-2 text-xs font-semibold py-1 px-2 rounded-md transition-opacity duration-200 border";
        switch (resource.type) {
            case 'video':
                return <button onClick={() => onOpenTutorial(resource.url, resource.title)} className={`${commonClasses} bg-theme-accent/10 text-theme-accent border-theme-accent/20 hover:bg-theme-accent/20`}><PlayIcon className="w-4 h-4" /> Ver</button>;
            case 'community':
                return <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`${commonClasses} bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20`}><ChatBubbleIcon className="w-4 h-4" /> Unirse</a>;
            case 'download':
                return <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`${commonClasses} bg-theme-accent-secondary/10 text-theme-accent-secondary border-theme-accent-secondary/20 hover:bg-theme-accent-secondary/20`}><DownloadIcon className="w-4 h-4" /> Abrir</a>;
            case 'faq':
                return null;
            default: return null;
        }
    }

    return (
        <div className="group flex justify-between items-start gap-3 p-3 rounded-lg bg-black/30 border border-theme-border hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3 flex-grow">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 mt-1">{renderIcon()}</div>
                <div className="flex-grow">
                    <h4 className="font-semibold text-theme-text">{resource.title}</h4>
                    <p className="text-sm text-theme-text-secondary">{resource.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {actionButton()}
              <button onClick={() => onToggleFavorite(resource.id)} className="p-2 rounded-full hover:bg-white/10" aria-label="Marcar como favorito">
                  {isFavorite ? <StarFilledIcon className="w-5 h-5 text-theme-priority" /> : <StarIcon className="w-5 h-5 text-theme-text-secondary group-hover:text-theme-priority transition-colors" />}
              </button>
            </div>
        </div>
    );
};


// --- Resource Center Modal --- //
interface ResourceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial: (url: string, title: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const ResourceCenterModal: React.FC<ResourceCenterModalProps> = ({ isOpen, onClose, onOpenTutorial, favorites, onToggleFavorite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategoryKey | 'all' | 'favorites'>('all');

  const filteredResources = useMemo(() => {
    let resources = [...resourceData];

    if (activeCategory === 'favorites') {
        resources = resources.filter(r => favorites.has(r.id));
    } else if (activeCategory !== 'all') {
        resources = resources.filter(r => r.category === activeCategory);
    }
    
    if (searchTerm.trim() !== '') {
        const lowercasedFilter = searchTerm.toLowerCase();
        resources = resources.filter(r => 
            r.title.toLowerCase().includes(lowercasedFilter) ||
            r.description.toLowerCase().includes(lowercasedFilter) ||
            r.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
        );
    }
    
    return resources;
  }, [searchTerm, activeCategory, favorites]);

  if (!isOpen) return null;

  const categoryButtons: { key: ResourceCategoryKey | 'all' | 'favorites', label: string }[] = [
    { key: 'all', label: 'Todos' },
    ...Object.entries(resourceCategories).map(([key, label]) => ({ key: key as ResourceCategoryKey, label })),
    { key: 'favorites', label: '⭐ Favoritos' }
  ];

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-theme-border-secondary">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent uppercase tracking-wider">
            Centro de Recursos
          </h1>
          <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-shrink-0 p-4 bg-black/20 border-b border-theme-border-secondary space-y-4">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en recursos por título, descripción o tag..."
                    className="w-full pl-4 pr-10 py-2 bg-theme-bg border-2 border-theme-border rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
                 {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-full text-theme-text-secondary hover:bg-white/10">
                        <XIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex justify-center flex-wrap gap-2">
                {categoryButtons.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 border ${activeCategory === key ? 'border-theme-accent text-theme-accent bg-theme-accent/10' : 'border-transparent text-theme-text-secondary hover:bg-white/10'}`}
                    >
                       {label}
                    </button>
                ))}
            </div>
        </div>

        <main className="flex-grow p-4 overflow-auto">
            {filteredResources.length > 0 ? (
                <div className="space-y-3">
                    {filteredResources.map(resource => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            isFavorite={favorites.has(resource.id)}
                            onToggleFavorite={onToggleFavorite}
                            onOpenTutorial={onOpenTutorial}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 px-4">
                    <h3 className="text-xl text-theme-accent-secondary">No se encontraron recursos.</h3>
                    <p className="text-theme-text-secondary mt-2">Intenta cambiar tu búsqueda o filtro.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

// --- Icon Components & Map --- //
const projectIcons: { [key: string]: React.FC<{className?: string}> } = {
  default: WaveformIcon,
  vocals: UserVoiceIcon,
  guitar: GuitarPickIcon,
  keys: PianoIcon,
  drums: DrumIcon,
  mix: HeadphonesIcon,
  synth: WaveSineIcon,
};

const iconKeys = Object.keys(projectIcons);

const ProjectIcon: React.FC<{ icon?: string; className?: string }> = ({ icon, className }) => {
  const IconComponent = projectIcons[icon || 'default'];
  return <IconComponent className={className} />;
};


// --- Edit Project Modal --- //
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (project: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('default');

    useEffect(() => {
        if(project) {
            setName(project.name);
            setIcon(project.icon || 'default');
        }
    }, [project]);

    if (!isOpen || !project) return null;

    const handleSave = () => {
        if (name.trim()) {
            onSave({ ...project, name: name.trim(), icon });
            onClose();
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
            <div
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-md flex flex-col animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
                    <h2 className="text-lg font-bold text-theme-accent-secondary">Editar Proyecto</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="projectName" className="block mb-2 text-sm font-medium text-theme-text">Nombre del Proyecto</label>
                        <input
                            type="text"
                            id="projectName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5"
                        />
                    </div>
                     <div>
                        <label className="block mb-2 text-sm font-medium text-theme-text">Icono del Proyecto</label>
                        <div className="grid grid-cols-4 gap-3 p-3 bg-black/20 rounded-lg">
                            {iconKeys.map(iconKey => (
                                <button
                                    key={iconKey}
                                    onClick={() => setIcon(iconKey)}
                                    className={`flex items-center justify-center p-3 rounded-md border-2 transition-all ${icon === iconKey ? 'border-theme-accent ring-2 ring-theme-accent bg-theme-accent/20' : 'border-theme-border hover:border-theme-accent'}`}
                                    aria-label={`Select ${iconKey} icon`}
                                >
                                    <ProjectIcon icon={iconKey} className="w-7 h-7 text-theme-text" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-4 bg-black/20 border-t border-theme-border-secondary">
                    <button onClick={handleSave} className="py-2 px-6 rounded-md font-semibold text-white transition-all duration-300 bg-theme-accent hover:opacity-90">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    )
}


// --- Settings Modal --- //
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onReset: () => void;
  themeName: ThemeName;
  onSetThemeName: (themeName: ThemeName) => void;
  projects: Project[];
  favorites: Set<string>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setThemeName: React.Dispatch<React.SetStateAction<ThemeName>>;
  setFavorites: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onLogout, onReset, themeName, onSetThemeName, 
    projects, favorites, setProjects, setThemeName, setFavorites
}) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const backupData = {
            mixingProjects: projects.map(p => ({
                ...p,
                subStepFeedback: Array.from(p.subStepFeedback.entries()),
            })),
            appTheme: themeName,
            resourceFavorites: Array.from(favorites),
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `rutadelviajero_backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File could not be read');
                const data = JSON.parse(text);

                if (data.mixingProjects && data.appTheme && data.resourceFavorites) {
                    const importedProjects: Project[] = data.mixingProjects.map((p: any) => ({
                        ...p,
                        subStepFeedback: new Map<string, SubStepFeedback>(p.subStepFeedback),
                    }));
                    setProjects(importedProjects);
                    setThemeName(data.appTheme);
                    setFavorites(new Set<string>(data.resourceFavorites));
                    alert('¡Progreso importado con éxito!');
                    onClose();
                } else {
                    throw new Error('El archivo de respaldo tiene un formato inválido.');
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert(`Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };


    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
            <div
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-md flex flex-col animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
                    <h2 className="text-lg font-bold text-theme-accent-secondary">Configuración</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-md font-semibold text-theme-text mb-3 text-center">Tema de la Aplicación</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.values(themes).map(theme => (
                                <button
                                    key={theme.name}
                                    onClick={() => onSetThemeName(theme.name)}
                                    className={`py-2 px-3 rounded-md text-sm font-semibold border-2 transition-all ${themeName === theme.name ? 'border-theme-accent ring-2 ring-theme-accent' : 'border-theme-border hover:border-theme-accent'}`}
                                >
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-theme-border pt-6 space-y-4">
                        <h3 className="text-md font-semibold text-theme-text text-center">Gestión de Datos</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={handleExport}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md font-semibold transition-all duration-300 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Exportar
                            </button>
                            <button 
                                onClick={handleImportClick}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md font-semibold transition-all duration-300 bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" />
                                Importar
                            </button>
                             <input type="file" accept=".json" ref={importInputRef} onChange={handleFileImport} className="hidden" />
                        </div>
                    </div>

                    <div className="border-t border-theme-border pt-6 space-y-4">
                         <h3 className="text-md font-semibold text-theme-text text-center">Acciones de la Cuenta</h3>
                        <button 
                            onClick={onReset}
                            className="w-full py-3 px-4 rounded-md font-semibold transition-all duration-300 bg-theme-danger/20 text-theme-danger hover:bg-theme-danger/30 border border-theme-danger/30"
                        >
                            Reiniciar Aplicación
                        </button>
                        <button 
                            onClick={onLogout}
                            className="w-full py-3 px-4 rounded-md font-semibold transition-all duration-300 bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Project Hub Component --- //
interface ProjectHubProps {
  projects: Project[];
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onLogout: () => void;
  onResetAllProjects: () => void;
  onOpenEQGuide: () => void;
  onOpenCompressionGuide: () => void;
  onOpenReverbGuide: () => void;
  onOpenSaturationGuide: () => void;
  themeName: ThemeName;
  onSetThemeName: (themeName: ThemeName) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenSearch: () => void;
  onSelectProject: (id: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setThemeName: React.Dispatch<React.SetStateAction<ThemeName>>;
  setFavorites: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ProjectHub: React.FC<ProjectHubProps> = ({ 
    projects, 
    onAddProject, 
    onDeleteProject, 
    onTogglePriority, 
    onUpdateProject,
    onLogout, 
    onResetAllProjects,
    onOpenEQGuide,
    onOpenCompressionGuide,
    onOpenReverbGuide,
    onOpenSaturationGuide,
    themeName,
    onSetThemeName,
    favorites,
    onToggleFavorite,
    onOpenSearch,
    onSelectProject,
    setProjects,
    setThemeName,
    setFavorites
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResourceCenterOpen, setIsResourceCenterOpen] = useState(false);
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [isBPMCalculatorOpen, setIsBPMCalculatorOpen] = useState(false);
  const [isAcousticsCheckOpen, setIsAcousticsCheckOpen] = useState(false);
  const [isBlindTestOpen, setIsBlindTestOpen] = useState(false);
  const [isReferenceTracksOpen, setIsReferenceTracksOpen] = useState(false); // New State

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [tutorialModalState, setTutorialModalState] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' });

  const handleOpenTutorial = useCallback((url: string, title: string) => {
    setTutorialModalState({ isOpen: true, url, title });
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setTutorialModalState({ isOpen: false, url: '', title: '' });
  }, []);
  
  const totalSubSteps = useMemo(() =>
    MIXING_STEPS.reduce((count, step) => count + step.subSteps.length, 0),
    []
  );

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
    }
  };
  
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return b.createdAt - a.createdAt;
    });
  }, [projects]);

  const handleSaveProject = (updatedProject: Project) => {
    onUpdateProject(updatedProject);
    setEditingProject(null);
  };

  const calculateProgress = (project: Project) => {
    const completedCount = Array.from(project.subStepFeedback.values()).filter(f => f.completed).length;
    return totalSubSteps > 0 ? (completedCount / totalSubSteps) * 100 : 0;
  };

  return (
    <>
    <div 
        className="min-h-screen bg-theme-bg background-grid flex flex-col"
    >
      <div className="container mx-auto px-4 py-8 md:py-12 flex-grow">
        <header className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <LogoIcon className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase">
                    Hub de Proyectos
                </h1>
                <p className="text-sm md:text-lg text-theme-accent">Tus Mezclas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
                href="https://tienda.bukoflow.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Ir a la Tienda"
            >
                <HomeIcon className="w-7 h-7" />
            </a>
            <button 
                onClick={onOpenSearch}
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Búsqueda Global"
            >
                <SearchIcon className="w-7 h-7" />
            </button>
            <button 
                onClick={() => setIsResourceCenterOpen(true)}
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Centro de Recursos"
            >
                <CollectionIcon className="w-7 h-7" />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Configuración"
            >
                <DotsVerticalIcon className="w-7 h-7" />
            </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto mb-8">
            <form onSubmit={handleAddProject} className="flex gap-4 p-4 bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg shadow-accent-secondary">
                <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nombre de la nueva mezcla..."
                    className="flex-grow bg-theme-bg border-2 border-theme-border-secondary text-theme-text rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary p-2.5"
                />
                <button type="submit" className="flex items-center gap-2 text-white bg-gradient-to-r from-theme-accent to-theme-accent-secondary hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-theme-accent-secondary font-medium rounded-lg px-5 py-2.5">
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Crear</span>
                </button>
            </form>
        </div>
        
        <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-xl font-bold text-theme-accent-secondary mb-4 text-center">Guías Profesionales</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <button
                    onClick={onOpenEQGuide}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-border-secondary text-theme-accent hover:bg-theme-accent/20 hover:shadow-lg hover:shadow-accent transform hover:-translate-y-1"
                >
                    <BookOpenIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Ecualización</span>
                </button>
                 <button
                    onClick={onOpenCompressionGuide}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-border text-theme-accent-secondary hover:bg-theme-accent-secondary/20 hover:shadow-lg hover:shadow-accent-secondary transform hover:-translate-y-1"
                >
                    <SlidersIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Compresión</span>
                </button>
                <button
                    onClick={onOpenReverbGuide}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1"
                >
                    <ReverbIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Reverb</span>
                </button>
                <button
                    onClick={onOpenSaturationGuide}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-1"
                >
                    <SaturationIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Saturación</span>
                </button>
                
                <button
                    onClick={() => setIsEstimatorOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-success/30 text-theme-success hover:bg-theme-success/20 hover:shadow-lg hover:shadow-theme-success/20 transform hover:-translate-y-1"
                >
                    <ClockIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Proyección Entrega</span>
                </button>

                <button
                    onClick={() => setIsBPMCalculatorOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 hover:shadow-lg hover:shadow-pink-500/20 transform hover:-translate-y-1"
                >
                    <MetronomeIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Calculadora BPM</span>
                </button>

                <button
                    onClick={() => setIsAcousticsCheckOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-1"
                >
                    <SpeakerWaveIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Simulador Entornos</span>
                </button>

                <button
                    onClick={() => setIsBlindTestOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-1"
                >
                    <ScaleIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Comparador A/B</span>
                </button>
                
                <button
                    onClick={() => setIsReferenceTracksOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-1"
                >
                    <ChartBarIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Caja Referencias</span>
                </button>
            </div>
        </div>

        <main className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
            {sortedProjects.length > 0 ? (
                sortedProjects.map(project => {
                    const progress = calculateProgress(project);
                    const isCompleted = progress >= 100;
                    return (
                        <div 
                           key={project.id} 
                           className={`group flex items-center gap-4 p-4 bg-theme-bg-secondary backdrop-blur-md border rounded-lg hover:bg-theme-accent-secondary/10 transition-all duration-300 transform hover:-translate-y-1 ${isCompleted ? 'border-theme-success/40' : 'border-theme-border/20'}`}
                        >
                           <div className="flex-grow cursor-pointer flex items-center gap-4" onClick={() => onSelectProject(project.id)}>
                               <ProjectIcon icon={project.icon} className="w-8 h-8 text-theme-accent-secondary flex-shrink-0" />
                               <div className="flex-grow">
                                   <h3 className={`font-bold text-lg ${project.isPriority ? 'text-theme-priority' : 'text-theme-text'}`}>{project.name}</h3>
                                   {isCompleted ? (
                                        <div className="flex items-center gap-2 mt-1 h-4">
                                            <CheckBadgeIcon className="w-6 h-6 text-theme-success" />
                                            <span className="text-theme-success font-semibold text-sm">Completado</span>
                                        </div>
                                    ) : (
                                        <ProgressBar progress={progress} />
                                    )}
                               </div>
                           </div>
                           <div className="flex items-center gap-1">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                                 className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                 aria-label="Editar"
                                >
                                  <PencilIcon className="w-5 h-5 text-theme-text-secondary group-hover:text-theme-accent" />
                                </button>
                                <button 
                                 onClick={(e) => { e.stopPropagation(); onTogglePriority(project.id); }}
                                 className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                 aria-label="Priorizar"
                                >
                                  {project.isPriority ? <StarFilledIcon className="w-6 h-6 text-theme-priority" /> : <StarIcon className="w-6 h-6 text-theme-text-secondary group-hover:text-theme-priority" />}
                                </button>
                                <button 
                                 onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                                 className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                 aria-label="Eliminar"
                                >
                                   <TrashIcon className="w-6 h-6 text-theme-text-secondary group-hover:text-theme-danger" />
                                </button>
                           </div>
                        </div>
                    )
                })
            ) : (
                <div className="text-center py-12 px-4 bg-theme-bg-secondary rounded-lg border border-dashed border-theme-border">
                    <h3 className="text-xl text-theme-accent-secondary">No hay proyectos todavía.</h3>
                    <p className="text-theme-text-secondary mt-2">Crea tu primer proyecto de mezcla para empezar la ruta.</p>
                </div>
            )}
        </main>
      </div>

      <footer className="mt-auto py-6 text-center text-theme-text-secondary text-sm w-full">
         <p>© 2025 | BUKOFLOW LLC</p>
      </footer>
    </div>
    <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={onLogout}
        onReset={onResetAllProjects}
        themeName={themeName}
        onSetThemeName={onSetThemeName}
        projects={projects}
        favorites={favorites}
        setProjects={setProjects}
        setThemeName={setThemeName}
        setFavorites={setFavorites}
    />
    <EditProjectModal 
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onSave={handleSaveProject}
    />
    <ResourceCenterModal 
        isOpen={isResourceCenterOpen}
        onClose={() => setIsResourceCenterOpen(false)}
        onOpenTutorial={handleOpenTutorial}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
    />
    <VideoTutorialModal 
        isOpen={tutorialModalState.isOpen}
        onClose={handleCloseTutorial}
        videoUrl={tutorialModalState.url}
        title={tutorialModalState.title}
    />
    <DeliveryEstimatorModal
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
        projects={projects}
    />
    <BPMCalculatorModal
        isOpen={isBPMCalculatorOpen}
        onClose={() => setIsBPMCalculatorOpen(false)}
    />
    <AcousticsCheckModal
        isOpen={isAcousticsCheckOpen}
        onClose={() => setIsAcousticsCheckOpen(false)}
    />
    <BlindTestModal
        isOpen={isBlindTestOpen}
        onClose={() => setIsBlindTestOpen(false)}
    />
     <ReferenceTracksModal
        isOpen={isReferenceTracksOpen}
        onClose={() => setIsReferenceTracksOpen(false)}
    />
    </>
  );
};

export default ProjectHub;
