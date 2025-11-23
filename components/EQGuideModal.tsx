
import React, { useState, useMemo, useEffect } from 'react';
import { eqData, tooltips } from '../data/eqData';
import { XIcon, ChevronDownIcon } from './icons';
import type { EQType } from '../types';

type TabType = 'asistente' | 'tipos' | 'instrumentos' | 'generos' | 'lista';

const TABS: { id: TabType, label: string }[] = [
    { id: 'asistente', label: 'Asistente' },
    { id: 'tipos', label: 'Tipos' },
    { id: 'instrumentos', label: 'Instrumentos' },
    { id: 'generos', label: 'Géneros' },
    { id: 'lista', label: 'Lista' },
];

interface EQGuideModalProps {
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
    const terms = Object.keys(tooltips);
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const matchingTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchingTerm) {
            return (
                <Tooltip key={index} text={tooltips[matchingTerm]}>
                    <span className="cursor-help border-b border-dotted border-theme-accent-secondary">{part}</span>
                </Tooltip>
            );
        }
        return part;
    });
};

const goalOptions: Record<string, string> = {
    '': 'Selecciona un objetivo...',
    'warmth': 'Añadir Calidez y Cuerpo',
    'punch': 'Añadir Presencia y Punch',
    'surgery': 'Control Quirúrgico y Limpieza',
    'air': 'Brillo y Aire',
    'glue': 'Cohesión de Grupo (Bus)',
};

const EQGuideModal: React.FC<EQGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('asistente');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

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

  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  const instrumentOptions = useMemo(() => eqData.instrumentos.map(i => i.instrumento), []);
  
  const recommendation = useMemo(() => {
    if (!selectedInstrument || !selectedGoal) return null;
    
    const instrumentRecsData = eqData.instrumentos.find(i => i.instrumento === selectedInstrument);
    if (!instrumentRecsData) return null;

    const instrumentRecs = [instrumentRecsData.opcion1, instrumentRecsData.opcion2, instrumentRecsData.opcion3];
    
    let targetEqs: string[] = [];
    switch(selectedGoal) {
        case 'warmth': targetEqs = ['Analógico Pasivo 💡']; break;
        case 'punch': targetEqs = ['Analógico Activo ⚡']; break;
        case 'surgery': targetEqs = ['Paramétrico 🎛️', 'Fase Lineal 💻']; break;
        case 'air': targetEqs = ['Analógico Pasivo 💡', 'Híbrido 🔌']; break;
        case 'glue': targetEqs = ['Analógico Pasivo 💡', 'Analógico Activo ⚡']; break;
    }

    const finalRecs = instrumentRecs.filter(eq => targetEqs.includes(eq));
    if (finalRecs.length === 0) {
        finalRecs.push(instrumentRecs[0]);
    }

    const recDetails = Array.from(new Set(finalRecs))
        .map(recName => eqData.tipos.find(t => t.tipo === recName))
        .filter(Boolean) as EQType[];

    let reason = `Para ${goalOptions[selectedGoal].toLowerCase()} en "${selectedInstrument}", se recomiendan ecualizadores que cumplan con este objetivo.`;
    if (selectedGoal === 'warmth') reason += ` Los EQs analógicos pasivos son ideales por su capacidad de añadir armónicos cálidos y redondear el sonido de forma musical.`;
    if (selectedGoal === 'punch') reason += ` Los EQs analógicos activos destacan por su carácter agresivo y su habilidad para realzar transientes.`;
    if (selectedGoal === 'surgery') reason += ` Los EQs paramétricos y de fase lineal ofrecen la precisión necesaria para limpiar frecuencias problemáticas sin añadir color no deseado.`;
    if (selectedGoal === 'air') reason += ` Ciertos EQs pasivos e híbridos tienen bandas de agudos muy musicales ('Air Bands') que añaden brillo sin ser estridentes.`;
    if (selectedGoal === 'glue') reason += ` En buses, los EQs con carácter analógico ayudan a unificar los elementos, dándoles un color tonal compartido.`;

    return {
        recommendations: recDetails,
        reason: reason,
    };
  }, [selectedInstrument, selectedGoal]);


  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return eqData;
    return {
      tipos: eqData.tipos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      instrumentos: eqData.instrumentos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      generos: eqData.generos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      lista: eqData.lista.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
    };
  }, [searchTerm]);


  if (!isOpen) return null;

  const characteristics: { key: keyof EQType; label: string }[] = [
    { key: 'ejemplos', label: 'Ejemplos Emblemáticos (Plugins) 🔌' }, { key: 'color', label: 'Color / Carácter (1-10) 🎨' }, { key: 'saturacion', label: 'Saturación Potencial (1-10) 🔥' }, { key: 'transparencia', label: 'Transparencia 🌟' }, { key: 'tipoColor', label: 'Tipo de Color Añadido 🖌️' }, { key: 'rasgos', label: 'Rasgos Sonoros Específicos 🎵' }, { key: 'aplicaciones', label: 'Aplicaciones Típicas 🎯' }, { key: 'ventajas', label: 'Ventajas ✅' }, { key: 'limitaciones', label: 'Limitaciones ⚠️' }, { key: 'frecuenciaControl', label: 'Control de Frecuencia ⏱️' }, { key: 'curvaTipo', label: 'Tipo de Curva 📈' }
  ];
  
  const eqPluginTypes = ['Paramétrico 🎛️', 'Gráfico 📊', 'Analógico Pasivo 💡', 'Analógico Activo ⚡', 'Fase Lineal 💻', 'Híbrido 🔌'];
  const groupedPlugins = eqPluginTypes.reduce((acc, type) => {
    acc[type] = filteredData.lista.filter(p => p.tipo === type);
    return acc;
  }, {} as Record<string, any[]>);
  

  const renderContent = () => {
      switch (activeTab) {
        case 'asistente':
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-theme-border">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-theme-text">1. ¿Qué estás ecualizando?</label>
                            <select value={selectedInstrument} onChange={e => setSelectedInstrument(e.target.value)} className="w-full p-3 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-theme-accent">
                                <option value="">Selecciona un instrumento...</option>
                                {instrumentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-theme-text">2. ¿Qué objetivo buscas?</label>
                            <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} className="w-full p-3 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-theme-accent">
                                {Object.entries(goalOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                    </div>
                    {recommendation ? (
                        <div className="mt-6 animate-fade-in-step">
                            <p className="text-center italic text-theme-text-secondary mb-4">{recommendation.reason}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendation.recommendations.map(rec => (
                                    <div key={rec.id} className="bg-black/30 p-4 rounded-lg border border-theme-border-secondary">
                                        <h3 className="font-bold text-lg text-theme-accent mb-2">{rec.tipo}</h3>
                                        <p className="text-sm text-theme-text mb-2"><strong className="text-theme-accent-secondary/80">Rasgos:</strong> {rec.rasgos}</p>
                                        <p className="text-sm text-theme-text"><strong className="text-theme-accent-secondary/80">Ideal para:</strong> {rec.ventajas}</p>
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
            );
        case 'tipos':
            return (
                <div className="space-y-3">
                    {filteredData.tipos.length > 0 ? filteredData.tipos.map(t => {
                        const isOpen = openAccordionId === t.id;
                        return (
                            <div key={t.id} className="border border-theme-border rounded-lg bg-black/20 overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setOpenAccordionId(isOpen ? null : t.id)}
                                    className="w-full flex justify-between items-center p-4 text-left font-bold text-theme-accent-secondary hover:bg-theme-accent-secondary/10"
                                >
                                    <span>{t.tipo}</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="p-4 bg-black/30 border-t border-theme-border">
                                        <ul className="space-y-3">
                                            {characteristics.map(char => (
                                                <li key={char.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                                                    <strong className="text-theme-accent-secondary/80 sm:col-span-1">{char.label}</strong>
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
            );
        case 'instrumentos':
             return (
                <div>
                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-4">
                        {filteredData.instrumentos.map(item => (
                            <div key={item.instrumento} className="bg-black/20 p-4 rounded-lg border border-theme-border">
                                <h3 className="font-bold text-lg text-theme-accent mb-3 border-b border-theme-border/30 pb-2">{item.instrumento}</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-theme-accent-secondary font-semibold">🥇 1ª Opción:</span> {item.opcion1}</p>
                                    <p><span className="text-theme-accent-secondary font-semibold">🥈 2ª Opción:</span> {item.opcion2}</p>
                                    <p><span className="text-theme-accent-secondary font-semibold">🥉 3ª Opción:</span> {item.opcion3}</p>
                                    <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                                        <p><span className="text-red-400 font-semibold">❌ Evitar:</span> {item.evitar}</p>
                                        <p className="text-xs text-gray-400 mt-1 italic">{applyTooltips(item.evitarRazon)}</p>
                                    </div>
                                    <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                        <p><span className="text-blue-300 font-semibold">💡 Notas:</span> {item.notas}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm text-left text-theme-text table-auto">
                            <thead className="bg-white/5 text-xs text-theme-accent-secondary uppercase">
                                <tr>
                                    <th className="px-4 py-3 w-1/4">Instrumento/Bus</th>
                                    <th className="px-4 py-3">🥇 1ª Opción</th>
                                    <th className="px-4 py-3">🥈 2ª Opción</th>
                                    <th className="px-4 py-3">🥉 3ª Opción</th>
                                    <th className="px-4 py-3">❌ Evitar</th>
                                    <th className="px-4 py-3 w-1/4">💡 Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.instrumentos.map(item => (
                                    <tr key={item.instrumento} className="border-b border-theme-border hover:bg-white/5">
                                        <td className="px-4 py-3 font-semibold">{item.instrumento}</td>
                                        <td className="px-4 py-3">{item.opcion1}</td>
                                        <td className="px-4 py-3">{item.opcion2}</td>
                                        <td className="px-4 py-3">{item.opcion3}</td>
                                        <td className="px-4 py-3">{item.evitar} <br/><em className="text-xs text-theme-text-secondary">({applyTooltips(item.evitarRazon)})</em></td>
                                        <td className="px-4 py-3">{item.notas}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'generos':
             return (
                <div>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredData.generos.map(item => (
                            <div key={item.genero} className="bg-black/20 p-4 rounded-lg border border-theme-border">
                                <h3 className="font-bold text-lg text-theme-accent mb-3 border-b border-theme-border/30 pb-2">{item.genero}</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong className="text-theme-accent-secondary">EQs:</strong> {item.ecualizadores}</p>
                                    <p><strong className="text-theme-accent-secondary">Enfoque:</strong> {item.enfoque}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[800px] text-sm text-left text-theme-text">
                            <thead className="bg-white/5 text-xs text-theme-accent-secondary uppercase">
                                <tr>
                                    <th className="px-4 py-3">Género</th>
                                    <th className="px-4 py-3">Ecualizadores Predominantes</th>
                                    <th className="px-4 py-3">Enfoque</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.generos.map(item => (
                                    <tr key={item.genero} className="border-b border-theme-border hover:bg-white/5">
                                        <td className="px-4 py-3 font-semibold">{item.genero}</td>
                                        <td className="px-4 py-3">{item.ecualizadores}</td>
                                        <td className="px-4 py-3">{item.enfoque}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'lista':
             return (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.entries(groupedPlugins).filter(([, plugins]) => plugins.length > 0).length > 0 ? (
                        Object.entries(groupedPlugins).filter(([, plugins]) => plugins.length > 0).map(([type, plugins]) => (
                            <div key={type} className="bg-black/30 p-4 rounded-lg border border-theme-border">
                                <h3 className="font-bold text-theme-accent-secondary mb-3 text-lg border-b border-theme-border-secondary pb-2">{type}</h3>
                                <ul className="space-y-3 text-sm">
                                    {(plugins as any[]).map(plugin => (
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
             );
        default:
            return null;
    }
  }


  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full h-full max-w-7xl flex flex-col animate-scale-up pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center border-b border-theme-border-secondary relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent uppercase tracking-wider">
            Guía Pro de Ecualización
          </h1>
          <p className="text-theme-accent-secondary/80 text-sm">Navega por las pestañas para explorar cada sección</p>
           <button onClick={onClose} className="absolute top-2 right-2 p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-shrink-0 p-4 bg-black/20 border-b border-theme-border-secondary space-y-4">
             <div className="max-w-3xl mx-auto relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en todas las secciones..."
                    className="w-full pl-4 pr-10 py-2 text-lg bg-theme-bg border-2 border-theme-border rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
                {searchTerm && (
                    <button onClick={handleClearSearch} className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full text-theme-text-secondary hover:bg-white/10">
                        <XIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex justify-center flex-wrap gap-x-2 gap-y-2 sm:gap-x-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === tab.id ? 'border-theme-accent text-theme-accent bg-theme-accent/10' : 'border-transparent text-theme-text-secondary hover:bg-white/10 hover:text-white'}`}
                    >
                       {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <main className="flex-grow p-4 overflow-auto custom-scrollbar">
            <div className="w-full h-full pb-10">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default EQGuideModal;
