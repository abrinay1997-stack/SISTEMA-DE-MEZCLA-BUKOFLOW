import React, { useState, useEffect } from 'react';
import type { Project, ReleaseProfile } from '../types';
import { XIcon } from './icons';

interface ReleaseProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, profile: ReleaseProfile) => void;
}

const ReleaseProfileModal: React.FC<ReleaseProfileModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const [profile, setProfile] = useState<ReleaseProfile>({
        genre: '',
        audienceSize: 'starting',
        budget: 'guerrilla',
        launchType: 'single',
        objective: 'streams',
    });

    useEffect(() => {
        if (project?.releaseProfile) {
            setProfile(project.releaseProfile);
        } else {
            // Reset to default when a new project is opened
            setProfile({
                genre: '',
                audienceSize: 'starting',
                budget: 'guerrilla',
                launchType: 'single',
                objective: 'streams',
            });
        }
    }, [project]);

    if (!isOpen || !project) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (profile.genre.trim() === '') {
            alert('Por favor, especifica un género musical.');
            return;
        }
        onSave(project.id, profile);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({ ...p, [name]: value }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({ ...p, [name]: value }));
    };

    const options = {
        audienceSize: [
            { value: 'starting', label: 'Empezando (<1k seguidores)' },
            { value: 'growing', label: 'En Crecimiento (1k-10k)' },
            { value: 'established', label: 'Establecido (>10k)' },
        ],
        budget: [
            { value: 'guerrilla', label: 'Guerrilla (0-100€)' },
            { value: 'indie', label: 'Indie (100-1000€)' },
            { value: 'advanced', label: 'Avanzado (>1000€)' },
        ],
        launchType: [
            { value: 'single', label: 'Single' },
            { value: 'ep', label: 'EP' },
            { value: 'album', label: 'Álbum' },
        ],
        objective: [
            { value: 'streams', label: 'Aumentar Streams' },
            { value: 'followers', label: 'Ganar Seguidores' },
            { value: 'press', label: 'Obtener Prensa/Blogs' },
            { value: 'merch', label: 'Vender Merchandising' },
        ],
    };

    return (
        <div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
            onClick={onClose}
        >
            <form
                onSubmit={handleSave}
                className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-lg flex flex-col animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
                    <h2 className="text-xl font-bold text-theme-accent-secondary">Perfil del Lanzamiento</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-auto">
                    <p className="text-sm text-theme-text-secondary">Define el contexto de "{project.name}" para recibir consejos personalizados.</p>
                    
                    <div>
                        <label htmlFor="genre" className="block mb-1 text-sm font-medium text-theme-text">Género / Estilo Principal</label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            value={profile.genre}
                            onChange={handleInputChange}
                            placeholder="Ej: Lo-Fi Hip Hop, Rock Alternativo..."
                            className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5"
                            required
                        />
                    </div>

                    {Object.entries(options).map(([key, opts]) => (
                        <div key={key}>
                            <label htmlFor={key} className="block mb-1 text-sm font-medium text-theme-text capitalize">
                                {key === 'audienceSize' ? 'Tamaño de Audiencia' : key === 'launchType' ? 'Tipo de Lanzamiento' : key === 'objective' ? 'Objetivo Principal' : 'Presupuesto'}
                            </label>
                            <select
                                id={key}
                                name={key}
                                value={profile[key as keyof typeof options]}
                                onChange={handleSelectChange}
                                className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5"
                            >
                                {opts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end p-4 bg-black/20 border-t border-theme-border-secondary">
                    <button type="submit" className="py-2 px-6 rounded-md font-semibold text-white transition-all duration-300 bg-theme-accent hover:opacity-90">
                        Guardar Perfil
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReleaseProfileModal;