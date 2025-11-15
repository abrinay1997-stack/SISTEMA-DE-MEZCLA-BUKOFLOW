export interface SubStep {
  id: string;
  text: string;
  subItems?: string[];
  tutorialUrl?: string;
}

export interface SubStepFeedback {
  completed: boolean;
  userNotes?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export interface Step {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  philosophy?: string;
  method?: string;
  note?: string;
  subSteps: SubStep[];
  geminiPrompt: string;
}

export interface Project {
  id: string;
  name: string;
  subStepFeedback: Map<string, SubStepFeedback>;
  isPriority: boolean;
  createdAt: number;
  icon: string;
  lastStepIndex: number;
}

//--- EQ Guide Types ---//
export interface EQType {
  id: string;
  tipo: string;
  transparencia: string;
  color: string;
  tipoColor: string;
  rasgos: string;
  ejemplos: string;
  aplicaciones: string;
  ventajas: string;
  limitaciones: string;
  frecuenciaControl: string;
  curvaTipo: string;
  saturacion: string;
}

export interface EQInstrument {
  instrumento: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  evitar: string;
  evitarRazon: string;
  notas: string;
}

export interface EQGenre {
  genero: string;
  ecualizadores: string;
  enfoque: string;
}

export interface EQPlugin {
  tipo: string;
  nombre: string;
  notasSonido: string;
}

export interface EQData {
  tipos: EQType[];
  instrumentos: EQInstrument[];
  generos: EQGenre[];
  lista: EQPlugin[];
}

//--- Compression Guide Types ---//
export interface CompressorType {
    id: string;
    tipo: string;
    transparencia: string;
    color: string;
    tipoColor: string;
    rasgos: string;
    ejemplos: string;
    aplicaciones: string;
    ventajas: string;
    limitaciones: string;
    ataqueRelease: string;
    ratioKnee: string;
    saturacion: string;
}

export interface CompressorInstrument {
    instrumento: string;
    opcion1: string;
    opcion2: string;
    opcion3: string;
    evitar: string;
    notas: string;
}

export interface CompressorGenre {
    genero: string;
    compresores: string;
    enfoque: string;
}

export interface CompressorPluginCategory {
    name: string;
    gratuitos: string[];
    pago: string[];
}

export interface CompressorPluginLists {
    [key: string]: CompressorPluginCategory;
}

export interface CompressionData {
    tipos: CompressorType[];
    instrumentos: CompressorInstrument[];
    generos: CompressorGenre[];
    listas: CompressorPluginLists;
}


//--- Reverb Guide Types ---//
export interface ReverbType {
  tipo: string;
  sonido: string;
  caracteristicas: string;
  decayTipico: string;
  densidad: string;
  usosComunes: string;
  ejemplos: string;
}

export interface ReverbInstrument {
  instrumento: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  notas: string;
}

export interface ReverbDesign {
  objetivo: string;
  tipoReverb: string;
  parametrosClave: string;
  resultado: string;
}

export interface ReverbPlugin {
  tipo: string;
  nombre: string;
  notasSonido: string;
}

export interface ReverbData {
  tipos: ReverbType[];
  usos: ReverbInstrument[];
  diseno: ReverbDesign[];
  lista: ReverbPlugin[];
}


//--- Saturation Guide Types ---//
export interface SaturationType {
    id: string;
    tipo: string;
    color: string;
    tipoColor: string;
    rasgos: string;
    ejemplos: string;
    aplicaciones: string;
    ventajas: string;
    limitaciones: string;
}

export interface SaturationInstrument {
    instrumento: string;
    opcion1: string;
    opcion2: string;
    opcion3: string;
    notas: string;
}

export interface SaturationGenre {
    genero: string;
    saturadores: string;
    enfoque: string;
}

export interface SaturationPlugin {
    tipo: string;
    nombre: string;
    notasSonido: string;
}

export interface SaturationData {
    tipos: SaturationType[];
    instrumentos: SaturationInstrument[];
    generos: SaturationGenre[];
    lista: SaturationPlugin[];
}

//--- Resource Center Types ---//
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'download' | 'community' | 'faq';
  url: string;
  category: 'introduccion' | 'comunidad' | 'preguntas';
  tags: string[];
  relatedSteps?: number[];
}

//--- Search Service Types ---//
export interface SearchResult {
    steps: Step[];
    guides: { guide: 'eq' | 'compression' | 'reverb' | 'saturation'; term: string }[];
    faqs: Resource[];
}
