import React, { useState, useMemo } from 'react';
import { compressionData, compressionTooltips } from '../data/compressionData';
import { XIcon, ChevronDownIcon } from './icons';
import type { CompressorType, CompressorPluginCategory } from '../types';

type TabType = 'asistente' | 'tipos' | 'instrumentos' | 'generos' | 'listas';

const TABS: { id: TabType, label: string }[] = [
    { id: 'asistente', label: 'Asistente' },
    { id: 'tipos', label: 'Tipos de Compresor' },
    { id: 'instrumentos', label: 'Instrumentos' },
    { id: 'generos', label: 'Géneros' },
    { id: 'listas', label: 'Lista de Plugins' },
];

interface CompressionGuideModalProps {
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
    <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-white/10 bg-theme-bg px-3 py-2 text-left text-sm text-theme-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {text}
    </span>
  </span>
);

const applyTooltips = (text: string | undefined) => {
    if (!text) return text;
    const terms = Object.keys(compressionTooltips);
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const matchingTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchingTerm) {
            return (
                <Tooltip key={index} text={compressionTooltips[matchingTerm]}>
                    <span className="cursor-help border-b border-dotted border-theme-accent-secondary">{part}</span>
                </Tooltip>
            );
        }
        return part;
    });
};

const goalOptions: Record<string, string> = {
    '': 'Selecciona un objetivo...',
    'punch': 'Añadir Punch y Agresividad',
    'glue': 'Añadir Cohesión de Grupo ("Glue")',
    'warmth': 'Añadir Suavidad y Calidez',
    'control': 'Control Transparente de Picos',
};

const CompressionGuideModal: React.FC<CompressionGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('asistente');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const instrumentOptions = useMemo(() => compressionData.instrumentos.map(i => i.instrumento), []);

  const recommendation = useMemo(() => {
    if (!selectedInstrument || !selectedGoal) return null;

    const instrumentRecsData = compressionData.instrumentos.find(i => i.instrumento === selectedInstrument);
    if (!instrumentRecsData) return null;

    const instrumentRecs = [instrumentRecsData.opcion1, instrumentRecsData.opcion2, instrumentRecsData.opcion3];
    
    let targetCompressors: string[] = [];
    let reason = `Para ${goalOptions[selectedGoal].toLowerCase()} en "${selectedInstrument}", se recomiendan compresores que cumplan con este objetivo.`;

    switch(selectedGoal) {
        case 'punch': 
            targetCompressors = ['FET ⚡', 'Diodo Puente 🔌'];
            reason += ' Los compresores FET son ultrarrápidos y agresivos, perfectos para realzar el ataque de baterías y voces. Los de Diodo Puente añaden un grosor y una "pegada" vintage muy característica.';
            break;
        case 'glue': 
            targetCompressors = ['VCA 🎚️', 'Válvulas 🔥'];
            reason += ' Los compresores VCA son el estándar para buses por su respuesta limpia y cohesiva. Los de Válvulas (Vari-Mu) añaden armónicos ricos que unifican los elementos de forma muy musical.';
            break;
        case 'warmth': 
            targetCompressors = ['Óptico 💡', 'Válvulas 🔥'];
            reason += ' Los compresores Ópticos tienen una respuesta suave y musical que es ideal para voces y bajos. Los de Válvulas añaden una calidez y tridimensionalidad inigualables.';
            break;
        case 'control': 
            targetCompressors = ['VCA 🎚️', 'Digital 💻'];
            reason += ' Los compresores VCA y Digitales ofrecen el control más preciso y transparente, ideales para masterización o cuando no se desea añadir color a la señal.';
            break;
    }

    const finalRecs = Array.from(new Set(instrumentRecs.filter(comp => targetCompressors.includes(comp))));
    if (finalRecs.length === 0) {
        finalRecs.push(...targetCompressors.slice(0, 2));
    }

    const recDetails = finalRecs
        .map(recName => compressionData.tipos.find(t => t.tipo === recName))
        .filter(Boolean) as CompressorType[];

    return {
        recommendations: recDetails,
        reason: reason,
    };
}, [selectedInstrument, selectedGoal]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return compressionData;

    const tipos = compressionData.tipos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term));
    const instrumentos = compressionData.instrumentos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term));
    const generos = compressionData.generos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term));
    
    const listas = Object.entries(compressionData.listas).reduce((acc, [key, value]) => {
        const filteredGratuitos = value.gratuitos.filter(p => p.toLowerCase().includes(term));
        const filteredPago = value.pago.filter(p => p.toLowerCase().includes(term));
        if (filteredGratuitos.length > 0 || filteredPago.length > 0 || value.name.toLowerCase().includes(term)) {
            acc[key] = { ...value, gratuitos: filteredGratuitos, pago: filteredPago };
        }
        return acc;
    }, {} as typeof compressionData.listas);

    return { tipos, instrumentos, generos, listas };
  }, [searchTerm]);


  if (!isOpen) return null;
  
  const characteristics: { key: keyof CompressorType; label: string }[] = [
    { key: 'ejemplos', label: 'Ejemplos Emblemáticos (Plugins) 🔌' }, { key: 'color', label: 'Color / Carácter (1-10) 🎨' }, { key: 'saturacion', label: 'Saturación Potencial (1-10) 🔥' }, { key: 'transparencia', label: 'Transparencia 🌟' }, { key: 'tipoColor', label: 'Tipo de Color Añadido 🖌️' }, { key: 'rasgos', label: 'Rasgos Sonoros Específicos 🎵' }, { key: 'aplicaciones', label: 'Aplicaciones Típicas 🎯' }, { key: 'ventajas', label: 'Ventajas ✅' }, { key: 'limitaciones', label: 'Limitaciones ⚠️' }, { key: 'ataqueRelease', label: 'Tiempo de Ataque / Release Típico ⏱️' }, { key: 'ratioKnee', label: 'Curva de Ratio / Knee 📈' }
  ];

  const renderContent = () => {
    switch(activeTab) {
        case 'asistente':
             return (
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-theme-border">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">1. ¿Qué estás comprimiendo?</label>
                                <select value={selectedInstrument} onChange={e => setSelectedInstrument(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-theme-accent">
                                    <option value="">Selecciona un instrumento...</option>
                                    {instrumentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">2. ¿Qué objetivo buscas?</label>
                                <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-theme-accent">
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
                            <div key={t.id} className="border border-theme-border-secondary rounded-lg bg-black/20 overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setOpenAccordionId(isOpen ? null : t.id)}
                                    className="w-full flex justify-between items-center p-4 text-left font-bold text-theme-accent hover:bg-theme-accent/10"
                                >
                                    <span>{t.tipo}</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="p-4 bg-black/30 border-t border-theme-border-secondary">
                                        <ul className="space-y-3">
                                            {characteristics.map(char => (
                                                <li key={char.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                                                    <strong className="text-theme-accent/80 sm:col-span-1">{char.label}</strong>
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
        case 'generos':
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm text-left text-theme-text md:table-auto table-fixed">
                        {activeTab === 'instrumentos' && (
                           <>
                                <thead className="bg-white/5 text-xs text-theme-accent uppercase hidden md:table-header-group">
                                    <tr>
                                        <th className="px-4 py-3 w-1/4">Instrumento/Bus</th>
                                        <th className="px-4 py-3">🥇 1ª Opción</th>
                                        <th className="px-4 py-3">🥈 2ª Opción</th>
                                        <th className="px-4 py-3">🥉 3ª Opción</th>
                                        <th className="px-4 py-3">❌ Evitar</th>
                                        <th className="px-4 py-3 w-1/4">💡 Notas</th>
                                    </tr>
                                </thead>
                                <tbody className="block md:table-row-group">
                                    {filteredData.instrumentos.map(item => (
                                         <tr key={item.instrumento} className="block md:table-row mb-4 md:mb-0 border md:border-b border-theme-border-secondary rounded-lg md:rounded-none">
                                            <td className="p-3 block md:table-cell font-semibold border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">Instrumento: </span>{item.instrumento}</td>
                                            <td className="p-3 block md:table-cell border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">🥇 1ª Opción: </span>{item.opcion1}</td>
                                            <td className="p-3 block md:table-cell border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">🥈 2ª Opción: </span>{item.opcion2}</td>
                                            <td className="p-3 block md:table-cell border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">🥉 3ª Opción: </span>{item.opcion3}</td>
                                            <td className="p-3 block md:table-cell border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">❌ Evitar: </span>{item.evitar}</td>
                                            <td className="p-3 block md:table-cell"><span className="md:hidden font-bold mr-2 text-theme-accent">💡 Notas: </span>{applyTooltips(item.notas)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </>
                        )}
                         {activeTab === 'generos' && (
                           <>
                                <thead className="bg-white/5 text-xs text-theme-accent uppercase hidden md:table-header-group">
                                    <tr>
                                        <th className="px-4 py-3">Género</th>
                                        <th className="px-4 py-3">Compresores Predominantes</th>
                                        <th className="px-4 py-3">Enfoque</th>
                                    </tr>
                                </thead>
                                <tbody className="block md:table-row-group">
                                    {filteredData.generos.map(item => (
                                        <tr key={item.genero} className="block md:table-row mb-4 md:mb-0 border md:border-b border-theme-border-secondary rounded-lg md:rounded-none">
                                            <td className="p-3 block md:table-cell font-semibold border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">Género: </span>{item.genero}</td>
                                            <td className="p-3 block md:table-cell border-b md:border-none border-theme-border-secondary"><span className="md:hidden font-bold mr-2 text-theme-accent">Compresores: </span>{applyTooltips(item.compresores)}</td>
                                            <td className="p-3 block md:table-cell"><span className="md:hidden font-bold mr-2 text-theme-accent">Enfoque: </span>{applyTooltips(item.enfoque)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </>
                        )}
                    </table>
                </div>
            );
        case 'listas':
            return (
                 <div className="space-y-6">
                    {Object.keys(filteredData.listas).length > 0 ? (
                         Object.values(filteredData.listas).map((typeData: CompressorPluginCategory) => (
                            <div key={typeData.name} className="p-4 bg-black/20 border border-theme-border-secondary rounded-lg">
                                <h3 className="text-lg font-bold text-theme-accent mb-4 border-b border-theme-border-secondary pb-2">{typeData.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                    <div>
                                        <h4 className="font-semibold text-theme-accent-secondary mb-2">Gratuitos</h4>
                                        {typeData.gratuitos.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm space-y-1 text-theme-text">
                                                {typeData.gratuitos.map(p => <li key={p}>{p}</li>)}
                                            </ul>
                                        ) : <p className="text-xs text-theme-text-secondary italic">N/A</p>}
                                    </div>
                                     <div>
                                        <h4 className="font-semibold text-theme-accent-secondary mb-2 mt-4 md:mt-0">De Pago</h4>
                                         {typeData.pago.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm space-y-1 text-theme-text">
                                                {typeData.pago.map(p => <li key={p}>{p}</li>)}
                                            </ul>
                                         ) : <p className="text-xs text-theme-text-secondary italic">N/A</p>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-center text-theme-text-secondary mt-8">No se encontraron resultados para "{searchTerm}".</p>
                    )}
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
        className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg shadow-secondary-lg w-full h-full max-w-7xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center border-b border-theme-border relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-theme-accent-secondary to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider">
            Guía Pro de Compresión
          </h1>
          <p className="text-theme-accent-secondary/80 text-sm">Navega por las pestañas para explorar cada sección</p>
           <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-shrink-0 p-4 bg-black/20 border-b border-theme-border space-y-4">
            <div className="max-w-3xl mx-auto relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en todas las secciones..."
                    className="w-full pl-4 pr-10 py-2 text-lg bg-theme-bg border-2 border-theme-border-secondary rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent-secondary"
                />
                {searchTerm && (
                     <button onClick={handleClearSearch} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-full text-theme-text-secondary hover:bg-white/10">
                        <XIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex justify-center flex-wrap gap-x-2 gap-y-2 sm:gap-x-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === tab.id ? 'border-theme-accent-secondary text-theme-accent-secondary bg-theme-accent-secondary/10' : 'border-transparent text-theme-text-secondary hover:bg-white/10 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <main className="flex-grow p-4 overflow-auto">
            <div className="w-full h-full">
               {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default CompressionGuideModal;