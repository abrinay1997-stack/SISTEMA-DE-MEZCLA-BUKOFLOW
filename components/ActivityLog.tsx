import React, { useState } from 'react';
import type { Project, ActivityLogItem } from '../types';
import { PlusIcon, ChatBubbleIcon } from './icons';

interface ActivityLogProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ project, onUpdateProject }) => {
    const [newLogText, setNewLogText] = useState('');

    const handleAddLog = () => {
        if (newLogText.trim() === '') return;
        const newLogItem: ActivityLogItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            text: newLogText.trim(),
            author: 'Tú', // In a real multi-user app, this would be dynamic
        };
        const updatedActivityLog = [newLogItem, ...project.activityLog];
        onUpdateProject({ ...project, activityLog: updatedActivityLog });
        setNewLogText('');
    };
    
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full max-w-4xl p-4 md:p-6 bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg animate-fade-in-step space-y-6">
            
            <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-8 h-8 text-theme-accent-secondary" />
                <h2 className="text-xl font-bold text-theme-accent-secondary">Actividad y Notas</h2>
            </div>
            
            {/* Add Log Entry */}
            <div className="bg-black/20 p-4 rounded-lg border border-theme-border space-y-3">
                <textarea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Añadir una nueva nota o registro de actividad..."
                    className="w-full h-24 p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm text-theme-text focus:ring-1 focus:ring-theme-accent-secondary focus:outline-none"
                />
                <div className="flex justify-end">
                    <button 
                        onClick={handleAddLog}
                        className="flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        Añadir Registro
                    </button>
                </div>
            </div>

            {/* Log List */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {project.activityLog.length > 0 ? (
                    project.activityLog.map(log => (
                        <div key={log.id} className="p-3 rounded-md bg-black/20 border-l-4 border-theme-border">
                            <p className="text-theme-text whitespace-pre-wrap">{log.text}</p>
                            <div className="text-xs text-theme-text-secondary mt-2">
                                <span>{log.author}</span> &bull; <span>{formatDate(log.timestamp)}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-theme-text-secondary italic py-6">No hay actividad registrada.</p>
                )}
            </div>

        </div>
    );
};

export default ActivityLog;
