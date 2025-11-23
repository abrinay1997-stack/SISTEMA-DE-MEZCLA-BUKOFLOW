
import React, { useRef } from 'react';
import type { Project } from '../types';
import { themes, ThemeName } from '../themes';
import { XIcon, DownloadIcon, ArrowUpTrayIcon } from './icons';

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
                        subStepFeedback: new Map<string, any>(p.subStepFeedback),
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
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-md flex flex-col animate-scale-up pt-safe pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
                    <h2 className="text-lg font-bold text-theme-accent-secondary">Configuración</h2>
                    <button onClick={onClose} className="p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
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

export default SettingsModal;