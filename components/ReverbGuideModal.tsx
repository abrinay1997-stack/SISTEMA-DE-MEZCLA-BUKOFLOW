
import React, { useState, useMemo, useEffect } from 'react';
import { reverbData, reverbTooltips } from '../data/reverbData';
import { XIcon, ChevronDownIcon } from './icons';
import type { ReverbType, ReverbPlugin } from '../types';

type FilterType = 'asistente' | 'tipos' | 'usos' | 'diseno' | 'lista';

interface ReverbGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => (
  <span className="group relative">
    {children}
    <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-white/10 bg-theme-bg px-3 py-2 text-left text-sm text-theme-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none">
      {text}
    </span>
  </span>
);

const applyTooltips = (text: string) => {
    if (!text) return text;
    const terms = Object.keys(reverbTooltips);
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const matchingTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchingTerm) {
            return (
                <Tooltip key={index} text={reverbTooltips[matchingTerm]}>
                    <span className="cursor-help border-b border-dotted border-purple-400">{part}</span>
                </Tooltip>
            );
        }
        return part;
    });
};

const goalOptions: Record<string, string> = {
    '': 'Selecciona un objetivo...',
    'cohesion': 'Crear Cohesión y Espacio Realista',
    'depth': 'Añadir Profundidad y Tamaño Épico',
    'presence': 'Añadir Brillo y Presencia',
    'vintage': 'Conseguir un Carácter Vintage',
    'creative': 'Crear Texturas y Efectos Creativos',
};

const ReverbGuideModal: React.FC<ReverbGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('asistente');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordionKey, setOpenAccordionKey] = useState<string | null>(null);

  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  // Scroll Lock Effect
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleClear = () => {
    setSearchTerm('');
    setActiveFilter('asistente');
    setOpenAccordionKey(null);
    setSelectedInstrument('');
    setSelectedGoal('');
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setOpenAccordionKey(null);
  }
  
  const instrumentOptions = useMemo(() => reverbData.usos.map(i => i.instrumento), []);
  
  const recommendation = useMemo(() => {
    if (!selectedInstrument || !selectedGoal) return null;

    const instrumentRecsData = reverbData.usos.find(i => i.instrumento === selectedInstrument);
    if (!instrumentRecsData) return null;

    const instrumentRecs = [instrumentRecsData.opcion1, instrumentRecsData.opcion2, instrumentRecsData.opcion3];
    
    let targetReverbs: string[] = [];
    let reason = `Para ${goalOptions[selectedGoal].toLowerCase()} en "${selectedInstrument}", se recomiendan reverbs que cumplan con este objetivo.`;

    switch(selectedGoal) {
        case 'cohesion': 
            targetReverbs = ['Room 🛋️']; 
            reason += ' Las reverbs tipo "Room" son perfectas para simular un espacio pequeño y creíble donde todos los instrumentos coexisten, "pegándolos" de forma natural.';
            break;
        case 'depth': 
            targetReverbs = ['Hall 🏛️', 'Convolution 🎤']; 
            reason += ' Las reverbs "Hall" y de Convolución (con IRs de espacios grandes) crean colas largas y difusas, ideales para dar una sensación de inmensidad y profundidad.';
            break;
        case 'presence': 
            targetReverbs = ['Plate ⚙️']; 
            reason += ' Las reverbs de "Placas" tienen un carácter brillante y denso que destaca en la mezcla, añadiendo presencia a voces y cajas sin embarrar el sonido.';
            break;
        case 'vintage': 
            targetReverbs = ['Spring 🌀', 'Plate ⚙️']; 
            reason += ' Las reverbs de "Muelles" (Spring) son el sonido clásico de los amplificadores de guitarra vintage. Las de Placas (Plate) fueron un estándar en los estudios de los 60 y 70.';
            break;
        case 'creative': 
            targetReverbs = ['Algorithmic 💻']; 
            reason += ' Las reverbs Algorítmicas son capaces de crear espacios imposibles y efectos como "Shimmer" o "Reverse", ideales para el diseño sonoro y la experimentación.';
            break;
    }

    const finalRecs = Array.from(new Set(instrumentRecs.filter(rev => targetReverbs.includes(rev))));
    if (finalRecs.length === 0) {
        finalRecs.push(...targetReverbs);
    }
     if (finalRecs.length === 0 && instrumentRecs.length > 0) {
        finalRecs.push(instrumentRecs[0]);
    }

    const recDetails = finalRecs
        .map(recName => reverbData.tipos.find(t => t.tipo === recName))
        .filter(Boolean) as ReverbType[];

    return {
        recommendations: recDetails,
        reason: reason,
    };
}, [selectedInstrument, selectedGoal]);


  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return reverbData;
    return {
      tipos: reverbData.tipos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      usos: reverbData.usos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      diseno: reverbData.diseno.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      lista: reverbData.lista.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
    };
  }, [searchTerm]);


  if (!isOpen) return null;
  
  const characteristics: { key: keyof ReverbType; label: string }[] = [
    { key: 'sonido', label: 'Sonido Característico' }, { key: 'caracteristicas', label: 'Características Principales' }, { key: 'decayTipico', label: 'Decay Típico' }, { key: 'densidad', label: 'Densidad' }, { key: 'usosComunes', label: 'Usos Comunes' }, { key: 'ejemplos', label: 'Ejemplos (Plugins)' }];
  
  const reverbPluginTypes = ['Algorithmic 💻', 'Convolution 🎤', 'Plate ⚙️', 'Spring 🌀', 'Hall / Room'];
  const groupedPlugins = reverbPluginTypes.reduce((acc, type) => {
    acc[type] = filteredData.lista.filter(p => p.tipo === type);
    return acc;
  }, {} as Record<string, ReverbPlugin[]>);


  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="bg-theme-bg-secondary backdrop-blur-md border border-purple-500/50 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] w-full h-full max-w-7xl flex flex-col animate-scale-up pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center border-b border-purple-500/30 relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
            Guía Pro de Reverb
          </h1>
          <p className="text-purple-200/80 text-sm">Tipos, Espacios y Funciones</p>
           <button onClick={onClose} className="absolute top-2 right-2 p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-shrink-0 p-4 bg-black/20 border-b border-purple-500/30">
            <div className="max-w-3xl mx-auto">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por instrumento, tipo, plugin..."
                    className="w-full px-4 py-2 text-lg bg-theme-bg border-2 border-indigo-500/30 rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mt-4">
                    {(['asistente', 'tipos', 'usos', 'diseno', 'lista'] as FilterType[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${activeFilter === filter ? 'bg-purple-500/20 border-purple-400 text-purple-200' : 'bg-black/30 border-transparent text-theme-text-secondary hover:bg-white/10 hover:border-purple-500/50'}`}
                        >
                           {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                    <button onClick={handleClear} className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-200 font-bold" aria-label="Limpiar">🔄</button>
                </div>
            </div>
        </div>
        
        <main className="flex-grow p-4 overflow-auto custom-scrollbar">
            <div className="w-full h-full pb-10">
                <div className="text-xl font-bold text-purple-300 mb-4 px-2">
                    {activeFilter === 'asistente' && 'Asistente Interactivo de Reverb'}
                    {activeFilter === 'tipos' && 'Características de Reverbs por Tipo'}
                    {activeFilter === 'usos' && 'Reverbs Recomendadas por Instrumento'}
                    {activeFilter === 'diseno' && 'Aplicaciones de Reverb para Diseño Sonoro'}
                    {activeFilter === 'lista' && 'Lista de Reverbs por Tipo'}
                </div>
                 {activeFilter === 'asistente' ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/30">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">1. ¿Qué quieres procesar?</label>
                                <select value={selectedInstrument} onChange={e => setSelectedInstrument(e.target.value)} className="w-full p-3 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-purple-500">
                                    <option value="">Selecciona un instrumento...</option>
                                    {instrumentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">2. ¿Qué objetivo buscas?</label>
                                <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} className="w-full p-3 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-purple-500">
                                    {Object.entries(goalOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                </select>
                            </div>
                        </div>
                        {recommendation ? (
                            <div className="mt-6 animate-fade-in-step">
                                <p className="text-center italic text-theme-text-secondary mb-4">{recommendation.reason}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recommendation.recommendations.map(rec => (
                                        <div key={rec.tipo} className="bg-black/30 p-4 rounded-lg border border-purple-500/30">
                                            <h3 className="font-bold text-lg text-purple-300 mb-2">{rec.tipo}</h3>
                                            <p className="text-sm text-theme-text mb-2"><strong className="text-purple-400/80">Sonido:</strong> {rec.sonido}</p>
                                            <p className="text-sm text-theme-text"><strong className="text-purple-400/80">Ideal para:</strong> {rec.usosComunes}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 mt-6 bg-black/10 rounded-lg">
                                <p className="text-theme-text-secondary">Selecciona un instrumento y un objetivo para ver la recomendación.</p>
                            </div>
                        )}
                    </div>
                ) : activeFilter === 'tipos' ? (
                     <div className="space-y-3">
                        {filteredData.tipos.length > 0 ? filteredData.tipos.map(t => {
                            const isOpen = openAccordionKey === t.tipo;
                            return (
                                <div key={t.tipo} className="border border-purple-500/20 rounded-lg bg-black/20 overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => setOpenAccordionKey(isOpen ? null : t.tipo)}
                                        className="w-full flex justify-between items-center p-4 text-left font-bold text-purple-200 hover:bg-purple-500/10"
                                    >
                                        <span>{t.tipo}</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="p-4 bg-black/30 border-t border-purple-500/20">
                                            <ul className="space-y-3">
                                                {characteristics.map(char => (
                                                    <li key={char.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                                                        <strong className="text-purple-300/80 sm:col-span-1">{char.label}</strong>
                                                        <div className="text-theme-text sm:col-span-2">{applyTooltips(t[char.key])}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )
                        }) : <p className="text-center text-theme-text-secondary mt-8">No se encontraron resultados para "{searchTerm}".</p>}
                    </div>
                ) : activeFilter === 'lista' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Object.entries(groupedPlugins).filter(([, plugins]) => plugins.length > 0).length > 0 ? (
                            Object.entries(groupedPlugins).filter(([, plugins]) => plugins.length > 0).map(([type, plugins]) => (
                                <div key={type} className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
                                    <h3 className="font-bold text-purple-300 mb-3 text-lg border-b border-purple-500/30 pb-2">{type}</h3>
                                    <ul className="space-y-3 text-sm">
                                        {(plugins as ReverbPlugin[]).map(plugin => (
                                            <li key={plugin.nombre}>
                                                <strong className="text-theme-text">{plugin.nombre}</strong>
                                                <p className="text-xs italic text-theme-text-secondary mt-1">{plugin.notasSonido}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : <p className="col-span-full text-center text-theme-text-secondary mt-8">No se encontraron resultados para "{searchTerm}".</p>}
                    </div>
                ) : (
                    <div>
                        {/* Mobile Cards */}
                        {activeFilter === 'usos' && (
                            <div className="md:hidden space-y-4">
                                {filteredData.usos.map(item => (
                                    <div key={item.instrumento} className="bg-black/20 p-4 rounded-lg border border-purple-500/30">
                                        <h3 className="font-bold text-lg text-purple-300 mb-3 border-b border-purple-500/20 pb-2">{item.instrumento}</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-purple-200 font-semibold">🥇 1ª Opción:</span> {item.opcion1}</p>
                                            <p><span className="text-purple-200 font-semibold">🥈 2ª Opción:</span> {item.opcion2}</p>
                                            <p><span className="text-purple-200 font-semibold">🥉 3ª Opción:</span> {item.opcion3}</p>
                                            <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                                <p><span className="text-purple-300 font-semibold">💡 Notas:</span> {item.notas}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeFilter === 'diseno' && (
                            <div className="md:hidden space-y-4">
                                {filteredData.diseno.map(item => (
                                    <div key={item.objetivo} className="bg-black/20 p-4 rounded-lg border border-purple-500/30">
                                        <h3 className="font-bold text-lg text-purple-300 mb-3 border-b border-purple-500/20 pb-2">{item.objetivo}</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong className="text-purple-200">Tipo Sugerido:</strong> {item.tipoReverb}</p>
                                            <p><strong className="text-purple-200">Parámetros:</strong> {applyTooltips(item.parametrosClave)}</p>
                                            <p><strong className="text-purple-200">Resultado:</strong> {item.resultado}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Desktop Tables */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-sm text-left text-theme-text table-auto">
                                {activeFilter === 'usos' && (
                                   <>
                                        <thead className="bg-white/5 text-xs text-purple-200 uppercase">
                                            <tr>
                                                <th className="px-4 py-3 w-1/4">Instrumento/Fuente</th>
                                                <th className="px-4 py-3">🥇 1ª Opción</th>
                                                <th className="px-4 py-3">🥈 2ª Opción</th>
                                                <th className="px-4 py-3">🥉 3ª Opción</th>
                                                <th className="px-4 py-3 w-1/3">💡 Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.usos.map(item => (
                                                <tr key={item.instrumento} className="border-b border-purple-500/20 hover:bg-white/5">
                                                    <td className="px-4 py-3 font-semibold">{item.instrumento}</td>
                                                    <td className="px-4 py-3">{item.opcion1}</td>
                                                    <td className="px-4 py-3">{item.opcion2}</td>
                                                    <td className="px-4 py-3">{item.opcion3}</td>
                                                    <td className="px-4 py-3">{item.notas}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                   </>
                                )}
                                 {activeFilter === 'diseno' && (
                                   <>
                                        <thead className="bg-white/5 text-xs text-purple-200 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Objetivo Creativo</th>
                                                <th className="px-4 py-3">Tipo de Reverb Sugerido</th>
                                                <th className="px-4 py-3">Parámetros Clave</th>
                                                <th className="px-4 py-3">Resultado Sonoro</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.diseno.map(item => (
                                                <tr key={item.objetivo} className="border-b border-purple-500/20 hover:bg-white/5">
                                                    <td className="px-4 py-3 font-semibold">{item.objetivo}</td>
                                                    <td className="px-4 py-3">{item.tipoReverb}</td>
                                                    <td className="px-4 py-3">{applyTooltips(item.parametrosClave)}</td>
                                                    <td className="px-4 py-3">{item.resultado}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                   </>
                                )}
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default ReverbGuideModal;
