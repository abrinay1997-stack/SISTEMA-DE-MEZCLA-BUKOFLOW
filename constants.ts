
import { Step } from './types';

// --- SECURITY CONSTANTS ---
// Si cambias estas claves, todos los usuarios con claves antiguas
// serán deslogueados automáticamente al recargar la página.
export const VALID_ACCESS_KEYS = ['abrinay', 'k4g', 'johnny', 'mrbombo', 'atfat', 'avalon'];

export const MIXING_STEPS: Step[] = [
  // Step 1
  {
    id: 1,
    title: 'POTENCIAR LA EMOCIÓN',
    subtitle: 'EL FOCO',
    category: 'Concepto',
    subSteps: [
      { id: 'step-1-1', text: 'Escuchar la canción varias veces y definir la emoción principal en 1-3 palabras (ej. eufórico, melancólico, agresivo).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-1-2', text: 'Identificar los 2-3 instrumentos o voces que son el corazón de esa emoción. Este es tu "Foco".', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-1-3', text: 'Crear una jerarquía inicial de mayor a menor importancia con relación al "Foco".', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 2
  {
    id: 2,
    title: 'FILOSOFÍA Y FUNDAMENTOS',
    subtitle: 'GAIN STAGING Y ENFOQUE DE MEZCLA',
    category: 'Fundamento',
    philosophy:'Antes de tocar un solo fader, define tu enfoque. Existen dos métodos de mezcla: "Bottom-Up", el método clásico de vieja escuela, donde todas las pistas tienen un Gain Staging de -18DBFS para tener "headroom". Y "Top-Down", un enfoque moderno donde las mezclas ya van preparadas para sonar cercano al resultado final.',
    subSteps: [
      { id: 'step-2-1', text: 'Escoge tu método: "Bottom-Up (-18DBFS)" o "Top-Down (ZERO TO HERO)"', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
    note: 'Tu DAW trabaja a 32-bit float, dándote un headroom interno casi infinito. El Gain Staging es para el CARÁCTER de tus plugins, no para la TÉCNICA de tu DAW.',
  },
  // Step 3
  {
    id: 3,
    title: 'ESTRUCTURA LA MEZCLA',
    subtitle: 'LIMPIEZA',
    category: 'Edición',
    subSteps: [
      { id: 'step-3-1', text: 'Rutea todas las pistas en grupos y subgrupos por familias (Drums, Bass, Instruments, Voces, FXs).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-2', text: 'Revisa la fase de ondulación de todas las pistas. Invertir la polaridad si es necesario.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-3', text: 'Edita todas las pistas: eliminar ruidos, clics, silencios no deseados y Aplicar fades (fundidos).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-4', text: 'Afina Voces e instrumentos.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-5', text: 'Sincronizar Voces & Cuantiza Instrumentos.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-6', text: 'Limpia respiraciones y sibilancias "el Santo grial de una mezcla profesional".', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-3-7', text: 'Ajustar el "Clip Gain" y "Gain Staging".', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 4
  {
    id: 4,
    title: 'BALANCE INICIAL',
    subtitle: 'VOLUMEN JERÁRQUICO',
    category: 'Balance',
    subSteps: [
      { id: 'step-4-1', text: 'Poner todos los faders a -∞ y empezar subiendo los elementos del "Foco" y de mayor importancia.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-4-2', text: 'Construir el balance de volumen alrededor del "Foco", pista por pista.', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
    note: 'Coloca el "Foco" (ej. Piano) y los elementos que aportan a su emoción (Violines, Guitarras, Sintes) Sin que afecten su inteligibilidad y emoción. Recuerda que siempre dependerá del estilo y género, Ej. el foco de un dubstep puede ser un "Kick/Bass" y el de un Jazz un "Saxofón"',
  },

  // Step 5
  {
    id: 5,
    title: 'ABRIR ESPACIO CON PANNING',
    subtitle: 'IMAGEN ESTÉREO CORRECTIVA Y ADITIVA',
    category: 'Imagen',
    philosophy: 'Aplica la filosofía "del Foco hacia afuera". El objetivo es construir la imagen estéreo de forma aditiva, asegurando que cada decisión de paneo. Trabaja del elemento más importante al menos importante.',
    method: 'Sin dejar de escuchar el foco, añade instrumentos uno por uno (del más al menos importante), paneándolos para que cada uno ocupe su propio espacio sin enmascarar a los demás.',
    subSteps: [
      { id: 'step-5-1', text: 'Paneo Mid-Side, El Efecto Haas "Pseudo Stereo", Stereo Enhancer, Stereo Enhancer Multibanda, Reverbs Cortas "Algo Experimental", Auto-Panning.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-5-2', text: 'Verificación de Fase: Revisa que las pistas con paneo extremo o ensanchadores estéreo no sufran problemas de fase.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-5-3', text: 'Evita el "fake mono" (sonido amplio que se cancela en mono).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-5-4', text: 'Prueba de Fuego (Chequeo en Mono): Al finalizar, comprueba la mezcla en mono. Asegúrate de que ningún elemento crucial desaparezca o pierda demasiada energía.', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 6
  {
    id: 6,
    title: 'ECUALIZACIÓN CORRECTIVA',
    subtitle: 'LIMPIEZA ESPECTRAL',
    category: 'Pistas Individuales',
    philosophy: 'Repetimos el proceso aditivo, esta vez para la ecualización. Al ecualizar cada nuevo elemento escuchando los anteriores, te aseguras de que encaje en el espectro de frecuencias sin competir innecesariamente.',
    method: 'Comienza ecualizando el "Foco" en solo para limpiarlo. Luego, sin mutear el "Foco", añade el siguiente elemento más importante y ecualízalo para que "respete" al Foco, creando "bolsillos" de frecuencia. Continúa este proceso aditivo con el resto de las pistas.',
    subSteps: [
      { id: 'step-6-1', text: 'Aplicar filtros de paso alto (HPF) en la mayoría de las pistas para eliminar graves innecesarios.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-6-2', text: 'Buscar y atenuar resonancias molestas con un Q estrecho (especialmente en voces, cajas y platillos).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-6-3', text: 'Resolver conflictos de enmascaramiento entre Kick y Bajo, y entre Voces y Guitarras/Teclados.', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 7
  {
    id: 7,
    title: 'COMPRESIÓN',
    subtitle: 'CONTROL DE DINÁMICA | Controla la Fuerza', 
    category: 'Pistas Individuales',
    philosophy: 'El objetivo ahora es controlar la dinámica de cada pista individual para que sea consistente y articulada, sin afectar aún la cohesión general. Se busca domar picos y realzar el cuerpo de cada sonido por separado.',
    method: 'Aplica compresión al "Foco" para controlar su dinámica y asegurar su presencia. Luego, uno por uno, añade los demás elementos, aplicando compresión individualmente para que cada pista tenga un nivel controlado y consistente antes de ser procesada en grupo.',
    subSteps: [
      { id: 'step-7-1', text: 'transient shapers, Gates, De-Essers', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-7-2', text: 'Comprimir de macro a micro "Serial Killer"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-7-3', text: 'Compresión Sidechain: Aparta de mi Camino', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-7-4', text: 'Compresión paralela "New York"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-7-5', text: 'Compresión Multibanda: para Frecuencias Rebeldes', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-7-6', text: 'Limitación: Simple y Multibanda', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
    note: 'El ataque y el release son cruciales. Un ataque rápido controla transientes, uno lento los deja pasar. Un release rápido crea bombeo, uno lento es más transparente. Ajusta siempre al ritmo de la canción.',
  },
  // Step 8
  {
    id: 8,
    title: 'ECUALIZACIÓN ADITIVA',
    subtitle: 'COLOR Y CARÁCTER',
    category: 'Pistas Individuales',
    philosophy: 'Repetimos el proceso aditivo, esta vez para la ecualización. Al ecualizar cada nuevo elemento escuchando los anteriores, te aseguras de que encaje en el espectro de frecuencias sin competir innecesariamente.',
    method: 'Ahora que la mezcla está limpia, es hora de añadir carácter.',
    subSteps: [
      { id: 'step-8-1', text: 'Ecualiza con saturación musical', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-8-2', text: 'EQ Match', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-8-3', text: 'Ecualiza "Pasiva"', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 9
  {
    id: 9,
    title: 'EFECTOS CREATIVOS',
    subtitle: 'PROFUNDIDAD Y ESPACIO',
    category: 'Creatividad',
    method: 'Crea un espacio tridimensional para tu mezcla. Usa buses de efectos para mantener la flexibilidad y ahorrar CPU.',
    subSteps: [
      { id: 'step-9-1', text: 'Configurar 2-3 buses de Reverb: uno corto (Room), uno medio (Plate/Hall) y uno largo (Hall/FX).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-9-2', text: 'Configurar 2 buses de Delay: uno corto (Slapback) y uno largo (estéreo sincronizado al tempo).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-9-3', text: 'Aplicar saturación para añadir calidez y armónicos (en pistas o en paralelo).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-9-4', text: 'Experimentar con modulación (Chorus, Flanger, Phaser) para añadir movimiento.', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 10
  {
    id: 10,
    title: 'AUTOMATIZACIÓN',
    subtitle: 'MOVIMIENTO Y VIDA',
    category: 'Creatividad',
    method: 'La automatización transforma una mezcla estática en una pieza dinámica y emocionante. Automatiza todo lo que pueda servir a la canción.',
    subSteps: [
      { id: 'step-10-1', text: 'Automatiza volúmenes (ej: de versos y coros)', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-10-2', text: 'Automatiza los envíos a Reverb y Delay para abrir espacios o enfatizar ciertas frases y secciones.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-10-3', text: 'Automatiza los efectos modulares.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-10-4', text: 'Automatiza filtros (HPF/LPF) para crear transiciones y efectos de "barrido".', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 11
  {
    id: 11,
    title: 'PROCESAMIENTO DE GRUPOS',
    subtitle: 'COHESIÓN (GLUE)',
    category: 'Procesamiento de Grupos',
    method: 'Procesar los grupos de instrumentos juntos ayuda a que suenen como una unidad cohesiva. Esto se conoce como "pegamento" o "glue".',
    subSteps: [
      { id: 'step-11-1', text: 'Compresión Side-Chain Drums to Bass "ej: trackspacer"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-2', text: 'Compresión Side-Chain Bass to Instruments "ej: trackspacer"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-3', text: 'Compresión Side-Chain Voces to Instruments "ej: trackspacer"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-4', text: 'Verifica la imagen estéreo de los grupos "La imagen se cierra"', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-5', text: 'EQ sustractiva en para la suma de resonancias, desenmascarar o abrir espacios Mid-Side', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-6', text: 'EQ Match del Mid-Side', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-7', text: 'Usar saturación de cinta para añadir calidez y cohesión analógica', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-8', text: 'Supresores de Resonancias para peinar frecuencias acumuladas', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-11-9', text: 'Compresión y limitación multibanda Mid-Side de picos y RMS', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 12
  {
    id: 12,
    title: 'PROCESAMIENTO DEL MÁSTER BUS',
    subtitle: 'PULIDO FINAL',
    category: 'Verificación',
    method: 'Ajustes finales y sutiles en el bus de mezcla principal para pulir el sonido general.',
    subSteps: [
      { id: 'step-12-1', text: 'Verifica la imagen estéreo multibanda.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-12-2', text: 'EQ Sustractiva y aditiva sutilmente.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-12-3', text: 'Usar compresión multibanda, Clippers y limitadores en serie para aumentar el volumen final de la mezcla a un nivel competitivo (-14 a -6 LUFS, dependiendo del estilo).', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 13
  {
    id: 13,
    title: 'VERIFICACIÓN Y REFERENCIAS',
    subtitle: 'CONTROL DE CALIDAD',
    category: 'Verificación',
    subSteps: [
      { id: 'step-13-1', text: 'Escuchar la mezcla en diferentes sistemas: monitores de estudio, auriculares, altavoces de portátil, coche. (Realphones)', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-13-2', text: 'Comparar referencia comerciales Mid-Side Multibanda de Peak y RMS', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  },
  // Step 14
  {
    id: 14,
    title: 'ENTREGA',
    subtitle: 'EXPORTACIÓN FINAL',
    category: 'Entrega',
    subSteps: [
      { id: 'step-14-1', text: 'Exportar la mezcla final en formato WAV o AIFF, a la misma frecuencia de muestreo y profundidad de bits del proyecto.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-14-2', text: 'Pico máximos de -1.0 a -0.2 dBFS para evitar clipping en la conversión a otros formatos.', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-14-3', text: 'Exportar (instrumental, a capella y Stems).', tutorialUrl: 'https://vimeo.com/365078627' },
      { id: 'step-14-4', text: 'Nombrar y organizar los archivos de forma clara y profesional antes de enviarlos.', tutorialUrl: 'https://vimeo.com/365078627' },
    ],
  }
];
