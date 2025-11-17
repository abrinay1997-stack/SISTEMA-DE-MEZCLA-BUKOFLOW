import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Project, SubStepFeedback, ReleaseProfile } from './types';
import { themes, ThemeName } from './themes';
import { useLocalStorage } from './hooks/useLocalStorage';
import LoginPage from './components/LoginPage';
import ProjectHub from './components/ProjectHub';
import ReleasePlanView from './components/ReleasePlanView';
import ConfirmModal from './components/ConfirmModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import { RELEASE_STEPS } from './constants';
import SpotifyExplorerModal from './components/SpotifyExplorerModal';
import MarketingGuideModal from './components/EQGuideModal';
import BrandingGuideModal from './components/CompressionGuideModal';
import ReleaseProfileModal from './components/ReleaseProfileModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [projects, setProjects] = useLocalStorage<Project[]>('releaseProjects', []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [themeName, setThemeName] = useLocalStorage<ThemeName>('app-theme', 'bukoflow-dark-orange');
  const [favorites, setFavorites] = useLocalStorage<Set<string>>('resourceFavorites', new Set());
  
  const [initialStepIndex, setInitialStepIndex] = useState<number | null>(null);

  // State for new release profile flow
  const [profilingProject, setProfilingProject] = useState<Project | null>(null);
  
  // State to pass project context to guide modals
  const [guideProject, setGuideProject] = useState<Project | null>(null);


  useEffect(() => {
    const theme = themes[themeName];
    const body = document.body;
    Object.entries(theme.colors).forEach(([key, value]) => {
      body.style.setProperty(key, value);
    });
  }, [themeName]);

  const [confirmAction, setConfirmAction] = useState<{ action: (() => void) | null; title: string; message: string }>({ action: null, title: '', message: '' });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSpotifyExplorerOpen, setIsSpotifyExplorerOpen] = useState(false);
  const [isMarketingGuideOpen, setIsMarketingGuideOpen] = useState(false);
  const [isBrandingGuideOpen, setIsBrandingGuideOpen] = useState(false);


  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  const handleAddProject = (name: string, releaseDate?: string) => {
    const newProjectSteps = JSON.parse(JSON.stringify(RELEASE_STEPS));

    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      subStepFeedback: new Map<string, SubStepFeedback>(),
      isPriority: false,
      createdAt: Date.now(),
      icon: 'default',
      lastStepIndex: 0,
      releaseDate,
      steps: newProjectSteps,
      budget: [],
      income: [],
      advances: 0,
      royaltySplits: '',
      activityLog: [],
      performanceSummary: {
        spotifyStreams: Math.floor(Math.random() * 20000) + 5000,
        instagramFollowersGained: Math.floor(Math.random() * 500) + 100,
        presaveCost: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
        tiktokViews: Math.floor(Math.random() * 400000) + 50000,
      }
    };
    setProjects(prev => [...prev, newProject]);
    setProfilingProject(newProject); // Open profile modal for the new project
  };

  const handleSaveProfile = (projectId: string, profile: ReleaseProfile) => {
    setProjects(prevProjects => 
        prevProjects.map(p => 
            p.id === projectId ? { ...p, releaseProfile: profile } : p
        )
    );
    setProfilingProject(null); // Close the modal
  };

  const handleDeleteProject = (id: string) => {
    setConfirmAction({
      action: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        closeConfirmModal();
      },
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este lanzamiento? Esta acción no se puede deshacer.'
    });
  };
  
  const handleResetAllProjects = () => {
    setConfirmAction({
      action: () => {
        setProjects([]);
        closeConfirmModal();
      },
      title: 'Confirmar Reinicio',
      message: '¿Estás seguro de que quieres reiniciar la aplicación? Se eliminarán TODOS los lanzamientos y su progreso. Esta acción no se puede deshacer.'
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

  const openMarketingGuide = (project: Project) => {
    setGuideProject(project);
    setIsMarketingGuideOpen(true);
  };

  const openBrandingGuide = (project: Project) => {
    setGuideProject(project);
    setIsBrandingGuideOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const mainContent = activeProject ? 
    <ReleasePlanView 
        project={activeProject} 
        onUpdateProject={handleUpdateProject} 
        onGoToHub={handleGoToHub}
        favorites={favorites}
        // FIX: The prop was being passed an undefined variable. Changed to use the correct handler function.
        onToggleFavorite={handleToggleFavorite}
        initialStepIndex={initialStepIndex}
        onClearInitialStep={() => setInitialStepIndex(null)}
        onOpenMarketingGuide={() => openMarketingGuide(activeProject)}
        onOpenBrandingGuide={() => openBrandingGuide(activeProject)}
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
      favorites={favorites}
      // FIX: The prop was being passed an undefined variable. Changed to use the correct handler function.
      onToggleFavorite={handleToggleFavorite}
      onOpenSearch={() => setIsSearchOpen(true)}
      onSelectProject={setActiveProjectId}
      setProjects={setProjects}
      setThemeName={setThemeName}
      setFavorites={setFavorites}
      onOpenSpotifyExplorer={() => setIsSpotifyExplorerOpen(true)}
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
        onOpenMarketingGuide={() => activeProject && openMarketingGuide(activeProject)}
        onOpenBrandingGuide={() => activeProject && openBrandingGuide(activeProject)}
      />
       <SpotifyExplorerModal
        isOpen={isSpotifyExplorerOpen}
        onClose={() => setIsSpotifyExplorerOpen(false)}
      />
      <MarketingGuideModal
        isOpen={isMarketingGuideOpen}
        onClose={() => setIsMarketingGuideOpen(false)}
        project={guideProject}
      />
       <BrandingGuideModal
        isOpen={isBrandingGuideOpen}
        onClose={() => setIsBrandingGuideOpen(false)}
        project={guideProject}
      />
      <ReleaseProfileModal
        isOpen={!!profilingProject}
        onClose={() => setProfilingProject(null)}
        project={profilingProject}
        onSave={handleSaveProfile}
       />
    </>
  );
};

export default App;