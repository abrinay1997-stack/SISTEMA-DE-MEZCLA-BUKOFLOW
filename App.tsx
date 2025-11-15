import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Project, SubStepFeedback } from './types';
import { themes, ThemeName } from './themes';
import { useLocalStorage } from './hooks/useLocalStorage';
import LoginPage from './components/LoginPage';
import ProjectHub from './components/ProjectHub';
import MixingView from './components/MixingView';
import ConfirmModal from './components/ConfirmModal';
import EQGuideModal from './components/EQGuideModal';
import CompressionGuideModal from './components/CompressionGuideModal';
import ReverbGuideModal from './components/ReverbGuideModal';
import SaturationGuideModal from './components/SaturationGuideModal';
import GlobalSearchModal from './components/GlobalSearchModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [projects, setProjects] = useLocalStorage<Project[]>('mixingProjects', []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [themeName, setThemeName] = useLocalStorage<ThemeName>('app-theme', 'cyberpunk');
  const [favorites, setFavorites] = useLocalStorage<Set<string>>('resourceFavorites', new Set());
  
  const [initialStepIndex, setInitialStepIndex] = useState<number | null>(null);

  useEffect(() => {
    const theme = themes[themeName];
    const body = document.body;
    Object.entries(theme.colors).forEach(([key, value]) => {
      body.style.setProperty(key, value);
    });
  }, [themeName]);

  const [confirmAction, setConfirmAction] = useState<{ action: (() => void) | null; title: string; message: string }>({ action: null, title: '', message: '' });

  const [isEQGuideOpen, setIsEQGuideOpen] = useState(false);
  const [isCompressionGuideOpen, setIsCompressionGuideOpen] = useState(false);
  const [isReverbGuideOpen, setIsReverbGuideOpen] = useState(false);
  const [isSaturationGuideOpen, setIsSaturationGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openEQGuide = useCallback(() => setIsEQGuideOpen(true), []);
  const closeEQGuide = useCallback(() => setIsEQGuideOpen(false), []);
  const openCompressionGuide = useCallback(() => setIsCompressionGuideOpen(true), []);
  const closeCompressionGuide = useCallback(() => setIsCompressionGuideOpen(false), []);
  const openReverbGuide = useCallback(() => setIsReverbGuideOpen(true), []);
  const closeReverbGuide = useCallback(() => setIsReverbGuideOpen(false), []);
  const openSaturationGuide = useCallback(() => setIsSaturationGuideOpen(true), []);
  const closeSaturationGuide = useCallback(() => setIsSaturationGuideOpen(false), []);

  const guideHandlers = {
    onOpenEQGuide: openEQGuide,
    onOpenCompressionGuide: openCompressionGuide,
    onOpenReverbGuide: openReverbGuide,
    onOpenSaturationGuide: openSaturationGuide,
  };

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      subStepFeedback: new Map<string, SubStepFeedback>(),
      isPriority: false,
      createdAt: Date.now(),
      icon: 'default',
      lastStepIndex: 0,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setConfirmAction({
      action: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        closeConfirmModal();
      },
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.'
    });
  };
  
  const handleResetAllProjects = () => {
    setConfirmAction({
      action: () => {
        setProjects([]);
        closeConfirmModal();
      },
      title: 'Confirmar Reinicio',
      message: '¿Estás seguro de que quieres reiniciar la aplicación? Se eliminarán TODOS los proyectos y su progreso. Esta acción no se puede deshacer.'
    });
  };

  const handleTogglePriority = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isPriority: !p.isPriority } : p));
  };
  
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };
  
  const handleToggleFavorite = useCallback((resourceId: string) => {
    setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.has(resourceId) ? newSet.delete(resourceId) : newSet.add(resourceId);
        return newSet;
    });
  }, [setFavorites]);

  const handleSelectProjectAndStep = (projectId: string, stepIndex: number) => {
    setInitialStepIndex(stepIndex);
    setActiveProjectId(projectId);
    setIsSearchOpen(false);
  };

  const handleGoToHub = () => {
      setActiveProjectId(null);
      setInitialStepIndex(null);
  }
  
  const closeConfirmModal = () => setConfirmAction({ action: null, title: '', message: '' });

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [activeProjectId, projects]);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const mainContent = activeProject ? 
    <MixingView 
        project={activeProject} 
        onUpdateProject={handleUpdateProject} 
        onGoToHub={handleGoToHub}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        initialStepIndex={initialStepIndex}
        onClearInitialStep={() => setInitialStepIndex(null)}
        {...guideHandlers}
    /> :
    <ProjectHub
      projects={projects}
      onAddProject={handleAddProject}
      onDeleteProject={handleDeleteProject}
      onTogglePriority={handleTogglePriority}
      onUpdateProject={handleUpdateProject}
      onLogout={handleLogout}
      onResetAllProjects={handleResetAllProjects}
      themeName={themeName}
      onSetThemeName={setThemeName}
      favorites={favorites}
      onToggleFavorite={handleToggleFavorite}
      onOpenSearch={() => setIsSearchOpen(true)}
// FIX: Pass the setActiveProjectId function to the ProjectHub component to handle project selection.
      onSelectProject={setActiveProjectId}
      {...guideHandlers}
    />;

  return (
    <>
      {mainContent}
      <ConfirmModal
        isOpen={!!confirmAction.action}
        onClose={closeConfirmModal}
        onConfirm={confirmAction.action}
        title={confirmAction.title}
        message={confirmAction.message}
      />
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projects={projects}
        onSelectProjectAndStep={handleSelectProjectAndStep}
        {...guideHandlers}
      />
      <EQGuideModal isOpen={isEQGuideOpen} onClose={closeEQGuide} />
      <CompressionGuideModal isOpen={isCompressionGuideOpen} onClose={closeCompressionGuide} />
      <ReverbGuideModal isOpen={isReverbGuideOpen} onClose={closeReverbGuide} />
      <SaturationGuideModal isOpen={isSaturationGuideOpen} onClose={closeSaturationGuide} />
    </>
  );
};

export default App;
