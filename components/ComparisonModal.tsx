import React, { useState, useMemo } from 'react';
import type { Project } from '../types';
import { XIcon, ChartBarIcon } from './icons';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, projects }) => {
    const [projectAId, setProjectAId] = useState<string | null>(null);
    const [projectBId, setProjectBId] = useState<string | null>(null);

    const projectA = useMemo(() => projects.find(p => p.id === projectAId), [projectAId, projects]);
    const projectB = useMemo(() => projects.find(p => p.id === projectBId), [projectBId, projects]);

    const calculateTotals = (project: Project) => {
        const budget = project.budget.reduce((acc, item) => ({ budgeted: acc.budgeted + item.budgeted, actual: acc.actual + item.actual }), { budgeted: 0, actual: 0 });
        const income = project.income.reduce((acc, item) => ({ projected: acc.projected + item.projected, actual: acc.actual + item.actual }), { projected: 0, actual: 0 });
        const netActual = income.actual - budget.actual;
        return { budget, income, netActual };
    };

    const totalsA = projectA ? calculateTotals(projectA) : null;
    const totalsB = projectB ? calculateTotals(projectB) : null;
    
    const MetricRow = ({ label, valueA, valueB, format = (v: any) => v, isHigherBetter = true }: { label: string, valueA?: any, valueB?: any, format?: (v: any) => string, isHigherBetter?: boolean }) => {
        const valA = valueA ?? 'N/A';
        const valB = valueB ?? 'N/A';
        let classA = 'text-theme-text';
        let classB = 'text-theme-text';

        if (typeof valueA === 'number' && typeof valueB === 'number' && valueA !== valueB) {
            if (isHigherBetter) {
                if (valueA > valueB) classA = 'text-theme-success'; else classB = 'text-theme-success';
            } else {
                if (valueA < valueB) classA = 'text-theme-success'; else classB = 'text-theme-success';
            }
        }

        return (
            <div className="grid grid-cols-3 items-center gap-4 py-3 border-b border-theme-border">
                <div className="text-sm text-theme-text-secondary text-right">{label}</div>
                <div className={`text-lg font-bold text-center ${classA}`}>{format(valA)}</div>
                <div className={`text-lg font-bold text-center ${classB}`}>{format(valB)}</div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop" onClick={onClose}>
            <div className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-theme-border-secondary">
                    <div className="flex items-center gap-3">
                        <ChartBarIcon className="w-7 h-7 text-theme-accent"/>
                        <h1 className="text-xl font-bold text-theme-accent">Comparar Lanzamientos</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition"><XIcon className="w-6 h-6" /></button>
                </header>
                
                <div className="flex-shrink-0 p-4 bg-black/20 grid grid-cols-2 gap-4">
                    <select value={projectAId ?? ''} onChange={e => setProjectAId(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm"><option value="">Seleccionar Proyecto A</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select value={projectBId ?? ''} onChange={e => setProjectBId(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm"><option value="">Seleccionar Proyecto B</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                </div>

                <main className="flex-grow p-4 overflow-auto">
                    {projectA && projectB ? (
                        <div>
                            <div className="grid grid-cols-3 items-center gap-4 py-2">
                                <div></div>
                                <div className="text-center font-bold text-theme-accent-secondary">{projectA.name}</div>
                                <div className="text-center font-bold text-theme-accent-secondary">{projectB.name}</div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-theme-accent mt-4">Finanzas</h3>
                                <MetricRow label="Gasto Real" valueA={totalsA?.budget.actual} valueB={totalsB?.budget.actual} format={v => `${v.toFixed(2)}€`} isHigherBetter={false} />
                                <MetricRow label="Ingreso Real" valueA={totalsA?.income.actual} valueB={totalsB?.income.actual} format={v => `${v.toFixed(2)}€`} isHigherBetter={true} />
                                <MetricRow label="Beneficio Neto" valueA={totalsA?.netActual} valueB={totalsB?.netActual} format={v => `${v.toFixed(2)}€`} isHigherBetter={true} />
                                
                                <h3 className="font-semibold text-theme-accent mt-6">Rendimiento (Simulado)</h3>
                                <MetricRow label="Streams Spotify" valueA={projectA.performanceSummary?.spotifyStreams} valueB={projectB.performanceSummary?.spotifyStreams} format={v => v.toLocaleString('es-ES')} isHigherBetter={true} />
                                <MetricRow label="Vistas TikTok" valueA={projectA.performanceSummary?.tiktokViews} valueB={projectB.performanceSummary?.tiktokViews} format={v => `${(v / 1000).toFixed(0)}k`} isHigherBetter={true} />
                                <MetricRow label="Nuevos Seguidores IG" valueA={projectA.performanceSummary?.instagramFollowersGained} valueB={projectB.performanceSummary?.instagramFollowersGained} format={v => v.toLocaleString('es-ES')} isHigherBetter={true} />
                                <MetricRow label="Coste por Pre-Save" valueA={projectA.performanceSummary?.presaveCost} valueB={projectB.performanceSummary?.presaveCost} format={v => `${v.toFixed(2)}€`} isHigherBetter={false} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-theme-text-secondary">Selecciona dos proyectos para compararlos.</div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ComparisonModal;