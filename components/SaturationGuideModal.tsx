import React, { useState, useMemo } from 'react';
import { saturationData, saturationTooltips } from '../data/saturationData';
import { XIcon, ChevronDownIcon } from './icons';
import type { SaturationType, SaturationPlugin } from '../types';

type FilterType = 'asistente' | 'tipos' | 'instrumentos' | 'generos' | 'lista';

interface SaturationGuideModalProps {
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

const applyTooltips = (text: string) => {
    if (!text) return text;
    const terms = Object.keys(saturationTooltips);
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const matchingTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchingTerm) {
            return (
                <Tooltip key={index} text={saturationTooltips[matchingTerm]}>
                    <span className="cursor-help border-b border-dotted border-amber-400">{part}</span>
                </Tooltip>
            );
        }
        return part;
    });
};

const goalOptions: Record<string, string> = {
    '': 'Selecciona un objetivo...',
    'glue': 'Añadir Calidez Sutil y Cohesión ("Glue")',
    'fatness': 'Engordar el Sonido y Añadir Riqueza Armónica',
    'punch': 'Añadir Presencia y "Mordida" Agresiva',
    'character': 'Distorsión con Carácter (Guitarras, Bajos)',
    'lofi': 'Efecto Lo-Fi y Degradación Digital',
};

const SaturationGuideModal: React.FC<SaturationGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('asistente');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const handleClear = () => {
    setSearchTerm('');
    setActiveFilter('asistente');
    setOpenAccordionId(null);
    setSelectedInstrument('');
    setSelectedGoal('');
  };
  
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setOpenAccordionId(null);
  };

  const instrumentOptions = useMemo(() => saturationData.instrumentos.map(i => i.instrumento), []);

  const recommendation = useMemo(() => {
    if (!selectedInstrument || !selectedGoal) return null;

    const instrumentRecsData = saturationData.instrumentos.find(i => i.instrumento === selectedInstrument);
    if (!instrumentRecsData) return null;

    const instrumentRecs = [instrumentRecsData.opcion1, instrumentRecsData.opcion2, instrumentRecsData.opcion3];
    
    let targetSaturators: string[] = [];
    let reason = `Para ${goalOptions[selectedGoal].toLowerCase()} en "${selectedInstrument}", se recomiendan saturadores que cumplan con este objetivo.`;

    switch(selectedGoal) {
        case 'glue': 
            targetSaturators = ['Cinta (Tape) 📼']; 
            reason += ' La saturación de cinta es famosa por su compresión suave y el redondeo de transientes, lo que ayuda a "pegar" los elementos de un bus de forma muy musical.';
            break;
        case 'fatness': 
            targetSaturators = ['Válvula (Tube) 🔥']; 
            reason += ' La saturación de válvula añade armónicos pares que el oído percibe como cálidos y musicales, haciendo que el sonido se sienta más grande, redondo y tridimensional.';
            break;
        case 'punch': 
            targetSaturators = ['Transistor (Solid State) ⚡']; 
            reason += ' La saturación de transistores es rica en armónicos impares, lo que resulta en un sonido más afilado, agresivo y con "punch", ideal para baterías y guitarras de rock.';
            break;
        case 'character': 
            targetSaturators = ['Overdrive 🎸', 'Fuzz 👹']; 
            reason += ' El Overdrive simula la distorsión de un amplificador a válvulas, ideal para un carácter dinámico. El Fuzz ofrece una distorsión extrema e icónica para estilos más pesados.';
            break;
        case 'lofi': 
            targetSaturators = ['Digital (Bitcrusher) 👾']; 
            reason += ' Los Bitcrushers degradan la calidad digital del audio (resolución de bits y frecuencia de muestreo), creando texturas robóticas y Lo-Fi perfectas para la música electrónica.';
            break;
    }

    const finalRecs = Array.from(new Set(instrumentRecs.filter(sat => targetSaturators.includes(sat))));
     if (finalRecs.length === 0) {
        finalRecs.push(...targetSaturators);
    }
     if (finalRecs.length === 0 && instrumentRecs.length > 0) {
        finalRecs.push(instrumentRecs[0]);
    }

    const recDetails = finalRecs
        .map(recName => saturationData.tipos.find(t => t.tipo === recName))
        .filter(Boolean) as SaturationType[];

    return {
        recommendations: recDetails,
        reason: reason,
    };
}, [selectedInstrument, selectedGoal]);


  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return saturationData;
    return {
      tipos: saturationData.tipos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      instrumentos: saturationData.instrumentos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      generos: saturationData.generos.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
      lista: saturationData.lista.filter(item => Object.values(item).join(' ').toLowerCase().includes(term)),
    };
  }, [searchTerm]);


  if (!isOpen) return null;

  const characteristics: { key: keyof SaturationType; label: string }[] = [
    { key: 'ejemplos', label: 'Ejemplos Emblemáticos (Plugins) 🔌' }, { key: 'color', label: 'Color / Carácter (1-10) 🎨' }, { key: 'tipoColor', label: 'Tipo de Color Añadido 🖌️' }, { key: 'rasgos', label: 'Rasgos Sonoros Específicos 🎵' }, { key: 'aplicaciones', label: 'Aplicaciones Típicas 🎯' }, { key: 'ventajas', label: 'Ventajas ✅' }, { key: 'limitaciones', label: 'Limitaciones ⚠️' }
  ];
  
  const pluginTypes = ['Multibanda/Versátil', 'Cinta 📼', 'Válvula 🔥', 'Digital 👾', 'Gratuito/Excelente'];
  const groupedPlugins = pluginTypes.reduce((acc, type) => {
    acc[type] = filteredData.lista.filter(p => p.tipo === type);
    return acc;
  }, {} as Record<string, SaturationPlugin[]>);


  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="bg-theme-bg-secondary backdrop-blur-md border border-amber-500/50 rounded-lg shadow-[0_0_30px_rgba(245,158,11,0.3)] w-full h-full max-w-7xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center border-b border-amber-500/30 relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
            Guía Pro de Saturación
          </h1>
          <p className="text-amber-200/80 text-sm">Carácter, Textura y Distorsión</p>
           <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-shrink-0 p-4 bg-black/20 border-b border-amber-500/30">
            <div className="max-w-3xl mx-auto">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por instrumento, género, tipo..."
                    className="w-full px-4 py-2 text-lg bg-theme-bg border-2 border-orange-500/30 rounded-full text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mt-4">
                    {(['asistente', 'tipos', 'instrumentos', 'generos', 'lista'] as FilterType[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${activeFilter === filter ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-black/30 border-transparent text-theme-text-secondary hover:bg-white/10 hover:border-amber-500/50'}`}
                        >
                           {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                    <button onClick={handleClear} className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-200 font-bold" aria-label="Limpiar">🔄</button>
                </div>
            </div>
        </div>
        
        <main className="flex-grow p-4 overflow-auto">
            <div className="w-full h-full">
                <div className="text-xl font-bold text-amber-300 mb-4 px-2">
                    {activeFilter === 'asistente' && 'Asistente Interactivo de Saturación'}
                    {activeFilter === 'tipos' && 'Características de Saturadores por Tipo'}
                    {activeFilter === 'instrumentos' && 'Saturadores Recomendados por Instrumento/Bus'}
                    {activeFilter === 'generos' && 'Saturadores Recomendados por Género'}
                    {activeFilter === 'lista' && 'Lista de Saturadores por Tipo'}
                </div>
                 {activeFilter === 'asistente' ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-amber-500/30">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">1. ¿Qué quieres saturar?</label>
                                <select value={selectedInstrument} onChange={e => setSelectedInstrument(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-amber-500">
                                    <option value="">Selecciona un instrumento...</option>
                                    {instrumentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-bold text-theme-text">2. ¿Qué objetivo buscas?</label>
                                <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md focus:ring-2 focus:ring-amber-500">
                                    {Object.entries(goalOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                </select>
                            </div>
                        </div>
                        {recommendation ? (
                            <div className="mt-6 animate-fade-in-step">
                                <p className="text-center italic text-theme-text-secondary mb-4">{recommendation.reason}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recommendation.recommendations.map(rec => (
                                        <div key={rec.id} className="bg-black/30 p-4 rounded-lg border border-amber-500/30">
                                            <h3 className="font-bold text-lg text-amber-300 mb-2">{rec.tipo}</h3>
                                            <p className="text-sm text-theme-text mb-2"><strong className="text-amber-400/80">Rasgos:</strong> {rec.rasgos}</p>
                                            <p className="text-sm text-theme-text"><strong className="text-amber-400/80">Ideal para:</strong> {rec.ventajas}</p>
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
                            const isOpen = openAccordionId === t.id;
                            return (
                                <div key={t.id} className="border border-amber-500/20 rounded-lg bg-black/20 overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => setOpenAccordionId(isOpen ? null : t.id)}
                                        className="w-full flex justify-between items-center p-4 text-left font-bold text-amber-200 hover:bg-amber-500/10"
                                    >
                                        <span>{t.tipo}</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="p-4 bg-black/30 border-t border-amber-500/20">
                                            <ul className="space-y-3">
                                                {characteristics.map(char => (
                                                    <li key={char.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                                                        <strong className="text-amber-300/80 sm:col-span-1">{char.label}</strong>
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
                                <div key={type} className="bg-black/30 p-4 rounded-lg border border-amber-500/20">
                                    <h3 className="font-bold text-amber-300 mb-3 text-lg border-b border-amber-500/30 pb-2">{type}</h3>
                                    <ul className="space-y-3 text-sm">
                                        {(plugins as SaturationPlugin[]).map(plugin => (
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
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm text-left text-theme-text md:table-auto table-fixed">
                            {activeFilter === 'instrumentos' && (
                               <>
                                    <thead className="bg-white/5 text-xs text-amber-200 uppercase hidden md:table-header-group">
                                        <tr>
                                            <th className="px-4 py-3 w-1/4">Instrumento/Bus</th>
                                            <th className="px-4 py-3">🥇 1ª Opción</th>
                                            <th className="px-4 py-3">🥈 2ª Opción</th>
                                            <th className="px-4 py-3">🥉 3ª Opción</th>
                                            <th className="px-4 py-3 w-1/3">💡 Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group">
                                        {filteredData.instrumentos.map(item => (
                                            <tr key={item.instrumento} className="block md:table-row mb-4 md:mb-0 border md:border-b border-amber-500/20 rounded-lg md:rounded-none">
                                                <td className="p-3 block md:table-cell font-semibold border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">Instrumento: </span>{item.instrumento}</td>
                                                <td className="p-3 block md:table-cell border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">🥇 1ª Opción: </span>{item.opcion1}</td>
                                                <td className="p-3 block md:table-cell border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">🥈 2ª Opción: </span>{item.opcion2}</td>
                                                <td className="p-3 block md:table-cell border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">🥉 3ª Opción: </span>{item.opcion3}</td>
                                                <td className="p-3 block md:table-cell"><span className="md:hidden font-bold mr-2 text-amber-300">💡 Notas: </span>{item.notas}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                               </>
                            )}
                             {activeFilter === 'generos' && (
                               <>
                                    <thead className="bg-white/5 text-xs text-amber-200 uppercase hidden md:table-header-group">
                                        <tr>
                                            <th className="px-4 py-3">Género</th>
                                            <th className="px-4 py-3">Saturadores Predominantes</th>
                                            <th className="px-4 py-3">Enfoque</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group">
                                        {filteredData.generos.map(item => (
                                             <tr key={item.genero} className="block md:table-row mb-4 md:mb-0 border md:border-b border-amber-500/20 rounded-lg md:rounded-none">
                                                <td className="p-3 block md:table-cell font-semibold border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">Género: </span>{item.genero}</td>
                                                <td className="p-3 block md:table-cell border-b md:border-none border-amber-500/20"><span className="md:hidden font-bold mr-2 text-amber-300">Saturadores: </span>{item.saturadores}</td>
                                                <td className="p-3 block md:table-cell"><span className="md:hidden font-bold mr-2 text-amber-300">Enfoque: </span>{item.enfoque}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                               </>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default SaturationGuideModal;