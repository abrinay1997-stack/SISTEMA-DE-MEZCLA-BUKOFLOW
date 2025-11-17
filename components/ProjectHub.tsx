import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Project, Resource, SubStepFeedback, Step } from '../types';
import { resourceData, resourceCategories } from '../data/resourceData';
import { themes, ThemeName } from '../themes';
// FIX: Import RELEASE_STEPS to be used in the data import logic.
import { RELEASE_STEPS } from '../constants';
import { 
    StarIcon, StarFilledIcon, TrashIcon, PlusIcon, DotsVerticalIcon, XIcon, CheckBadgeIcon, PencilIcon,
    MarketingIcon, BrandingIcon, SpotifyIcon,
    MusicNoteIcon, MicrophoneIcon, GuitarIcon, PianoIcon, DrumIcon, HeadphonesIcon, SlidersIcon,
    DownloadIcon, CollectionIcon, ChatBubbleIcon, QuestionMarkCircleIcon, SearchIcon, ArrowUpTrayIcon,
    ChartBarIcon
} from './icons';
import ProgressBar from './ProgressBar';
import VideoTutorialModal from './VideoTutorialModal';
import ComparisonModal from './ComparisonModal';
import VisualAssetCreatorModal from './VisualAssetCreatorModal';

type ResourceCategoryKey = keyof typeof resourceCategories;

// --- Resource Card Component (reusable) --- //
interface ResourceCardProps {
    resource: Resource;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isFavorite, onToggleFavorite }) => {
    const renderIcon = () => {
        switch (resource.type) {
            case 'community': return <ChatBubbleIcon className="w-5 h-5 text-green-400" />;
            case 'download': return <DownloadIcon className="w-5 h-5 text-theme-accent" />;
            case 'faq': return <QuestionMarkCircleIcon className="w-5 h-5 text-indigo-400" />;
            case 'link': return <svg className="w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
            default: return null;
        }
    };
    
    const actionButton = () => {
        const commonClasses = "flex-shrink-0 flex items-center gap-2 text-xs font-semibold py-1 px-2 rounded-md transition-opacity duration-200 border";
        switch (resource.type) {
            case 'community':
            case 'link':
            case 'download':
                return <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`${commonClasses} bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20`}><svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 4.5V3m0 0L9 6m3-3l3 3" /></svg> Abrir</a>;
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
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const ResourceCenterModal: React.FC<ResourceCenterModalProps> = ({ isOpen, onClose, favorites, onToggleFavorite }) => {
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
  default: MusicNoteIcon,
  vocals: MicrophoneIcon,
  guitar: GuitarIcon,
  keys: PianoIcon,
  drums: DrumIcon,
  mix: HeadphonesIcon,
  electronic: SlidersIcon,
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
    const [releaseDate, setReleaseDate] = useState('');

    useEffect(() => {
        if(project) {
            setName(project.name);
            setIcon(project.icon || 'default');
            setReleaseDate(project.releaseDate || '');
        }
    }, [project]);

    if (!isOpen || !project) return null;

    const handleSave = () => {
        if (name.trim()) {
            onSave({ ...project, name: name.trim(), icon, releaseDate });
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
                    <h2 className="text-lg font-bold text-theme-accent-secondary">Editar Lanzamiento</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="projectName" className="block mb-2 text-sm font-medium text-theme-text">Nombre del Lanzamiento</label>
                        <input
                            type="text"
                            id="projectName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5"
                        />
                    </div>
                    <div>
                        <label htmlFor="releaseDate" className="block mb-2 text-sm font-medium text-theme-text">Fecha de Lanzamiento</label>
                        <input
                            type="date"
                            id="releaseDate"
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
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
  setFavorites: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onLogout, onReset, themeName, onSetThemeName, 
    projects, favorites, setProjects, setFavorites
}) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const backupData = {
            releaseProjects: projects.map(p => ({
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
        a.download = `guia_lanzamiento_backup_${date}.json`;
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

                if (data.releaseProjects && data.appTheme && data.resourceFavorites) {
                    const importedProjects: Project[] = data.releaseProjects.map((p: any) => ({
                        ...p,
                        steps: (p.steps && p.steps.length > 0) ? p.steps : JSON.parse(JSON.stringify(RELEASE_STEPS)),
                        budget: p.budget || [],
                        activityLog: p.activityLog || [],
                        subStepFeedback: new Map<string, SubStepFeedback>(p.subStepFeedback),
                    }));
                    setProjects(importedProjects);
                    onSetThemeName(data.appTheme);
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
  onAddProject: (name: string, releaseDate?: string) => void;
  onDeleteProject: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onLogout: () => void;
  onResetAllProjects: () => void;
  onOpenSpotifyExplorer: () => void;
  themeName: ThemeName;
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
    onOpenSpotifyExplorer,
    themeName,
    favorites,
    onToggleFavorite,
    onOpenSearch,
    onSelectProject,
    setProjects,
    setThemeName,
    setFavorites
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResourceCenterOpen, setIsResourceCenterOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAssetCreatorOpen, setIsAssetCreatorOpen] = useState(false);
  const newProjectNameInputRef = useRef<HTMLInputElement>(null);
  
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim(), newProjectDate || undefined);
      setNewProjectName('');
      setNewProjectDate('');
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
    const totalSubSteps = project.steps.reduce((count, step) => count + step.subSteps.length, 0);
    if (totalSubSteps === 0) return 0;
    const completedCount = Array.from(project.subStepFeedback.values()).filter(f => f.completed).length;
    return (completedCount / totalSubSteps) * 100;
  };
  
  const getCountdown = (releaseDate?: string) => {
    if (!releaseDate) return null;
    const release = new Date(`${releaseDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < - (1000 * 60 * 60 * 24)) return { text: "Lanzado", isPast: true };
    if (diffDays === 0) return { text: "¡Hoy!", isPast: false, isToday: true };
    if (diffDays === 1) return { text: "Mañana", isPast: false };
    return { text: `en ${diffDays} días`, isPast: false };
  }

  return (
    <>
    <div 
        className="min-h-screen bg-theme-bg background-grid"
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <img alt="Logo" className="w-12 h-auto md:w-16 md:h-auto filter drop-shadow-[0_0_8px_var(--theme-accent)]" src="https://hostedimages-cdn.aweber-static.com/MjM0MTQ0NQ==/thumbnail/188302f5ca5241bd9111d44862883f63.png" />
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase">
                    Panel de Proyectos
                </h1>
                <p className="text-sm md:text-lg text-theme-accent">Tus Lanzamientos Musicales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={onOpenSearch}
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Búsqueda Global"
            >
                <SearchIcon className="w-7 h-7" />
            </button>
             <button 
                onClick={() => setIsComparisonOpen(true)}
                className="p-2 rounded-full text-theme-text hover:bg-white/10 transition-all duration-300"
                aria-label="Comparar Lanzamientos"
            >
                <ChartBarIcon className="w-7 h-7" />
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
            <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-4 p-4 bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg shadow-accent-secondary">
                <input
                    ref={newProjectNameInputRef}
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nombre del nuevo lanzamiento..."
                    className="flex-grow bg-theme-bg border-2 border-theme-border-secondary text-theme-text rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary p-2.5"
                    required
                />
                <input
                    type="date"
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    className="sm:w-48 bg-theme-bg border-2 border-theme-border-secondary text-theme-text rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary p-2.5"
                />
                <button type="submit" className="flex items-center justify-center gap-2 text-white bg-gradient-to-r from-theme-accent to-theme-accent-secondary hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-theme-accent-secondary font-medium rounded-lg px-5 py-2.5">
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Crear</span>
                </button>
            </form>
        </div>
        
        <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-xl font-bold text-theme-accent-secondary mb-4 text-center">Herramientas y Guías</h2>
            <div className="max-w-xs mx-auto">
                 <button
                    onClick={onOpenSpotifyExplorer}
                    className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-bold transition-all duration-300 bg-theme-bg-secondary border border-theme-border text-green-500 hover:bg-green-500/10 hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1"
                >
                    <SpotifyIcon className="w-8 h-8" />
                    <span className="text-sm text-center">Análisis e Investigación de Artistas</span>
                </button>
            </div>
        </div>

        <main className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
            {sortedProjects.length > 0 ? (
                sortedProjects.map(project => {
                    const progress = calculateProgress(project);
                    const isCompleted = progress >= 100;
                    const countdown = getCountdown(project.releaseDate);
                    return (
                        <div 
                           key={project.id} 
                           className={`group flex items-center gap-4 p-4 bg-theme-bg-secondary backdrop-blur-md border rounded-lg hover:bg-theme-accent-secondary/10 transition-all duration-300 transform hover:-translate-y-1 ${isCompleted ? 'border-theme-success/40' : 'border-theme-border/20'}`}
                        >
                           <div className="flex-grow cursor-pointer flex items-center gap-4" onClick={() => onSelectProject(project.id)}>
                               <ProjectIcon icon={project.icon} className="w-8 h-8 text-theme-accent-secondary flex-shrink-0" />
                               <div className="flex-grow">
                                   <div className="flex items-center gap-2">
                                     <h3 className={`font-bold text-lg ${project.isPriority ? 'text-theme-priority' : 'text-theme-text'}`}>{project.name}</h3>
                                     {countdown && (
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countdown.isPast ? 'bg-gray-500/20 text-gray-300' : countdown.isToday ? 'bg-theme-accent text-white' : 'bg-theme-accent-secondary/20 text-theme-accent-secondary'}`}>
                                             {countdown.text}
                                         </span>
                                     )}
                                   </div>
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
                 <div className="text-center py-12 px-4 bg-theme-bg-secondary rounded-lg border border-dashed border-theme-border animate-fade-in-step">
                    <h3 className="text-2xl font-bold text-theme-accent-secondary">¡Bienvenido a tu Asistente de Lanzamiento!</h3>
                    <p className="text-theme-text-secondary mt-2 mb-8 max-w-xl mx-auto">Empecemos a construir tu próximo éxito. ¿Qué te gustaría hacer primero?</p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button 
                            onClick={() => newProjectNameInputRef.current?.focus()}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 py-3 px-6 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-theme-accent to-theme-accent-secondary text-white hover:shadow-lg hover:shadow-accent-secondary/30 transform hover:-translate-y-1"
                        >
                            <PlusIcon className="w-6 h-6" />
                            Crear mi primer plan de lanzamiento
                        </button>
                        <button
                            onClick={onOpenSpotifyExplorer}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 py-3 px-6 rounded-lg font-semibold transition-all duration-300 bg-theme-bg border-2 border-theme-border text-theme-text hover:border-theme-accent transform hover:-translate-y-1"
                        >
                            <SpotifyIcon className="w-6 h-6" />
                            Investigar artistas para inspirarme
                        </button>
                    </div>
                </div>
            )}
        </main>

      </div>
    </div>
    <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={onLogout}
        onReset={onResetAllProjects}
        themeName={themeName}
        onSetThemeName={setThemeName}
        projects={projects}
        favorites={favorites}
        setProjects={setProjects}
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
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
    />
     <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        projects={projects}
    />
    <VisualAssetCreatorModal
        isOpen={isAssetCreatorOpen}
        onClose={() => setIsAssetCreatorOpen(false)}
    />
    </>
  );
};

export default ProjectHub;