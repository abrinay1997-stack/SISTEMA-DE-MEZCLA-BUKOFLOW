import { Step } from './types';

export const RELEASE_STEPS: Step[] = [
  {
    id: 1,
    title: '6 SEMANAS ANTES: Cimientos',
    subtitle: 'PREPARACIÓN Y ESTRATEGIA INICIAL',
    category: 'Planificación',
    philosophy: 'La base de un lanzamiento exitoso se construye mucho antes de que el público escuche la primera nota. Esta semana se centra en asegurar que todos los activos y la estrategia principal estén listos.',
    subSteps: [
      { id: 'release-1-1', text: 'Finalizar la mezcla y el máster de la canción. Asegúrate de tener las versiones finales (WAV, MP3, instrumental).' },
      { id: 'release-1-2', text: 'Diseñar la portada del sencillo en alta resolución (mínimo 3000x3000 píxeles).', guideLink: 'branding' },
      { id: 'release-1-3', text: 'Escribir la biografía del artista y la nota de prensa del lanzamiento.', guideLink: 'branding' },
      { id: 'release-1-4', text: 'Registrar la composición en tu Entidad de Gestión de Derechos (PRO, ej. SGAE, BMI, ASCAP).' },
      { id: 'release-1-5', text: 'Definir los objetivos del lanzamiento (ej. número de streams, apariciones en playlists, seguidores ganados).', guideLink: 'marketing' },
    ],
  },
  {
    id: 2,
    title: '5 SEMANAS ANTES: Imagen',
    subtitle: 'CONSTRUCCIÓN DE LA MARCA VISUAL',
    category: 'Branding',
    philosophy: 'Tu música necesita una identidad visual coherente que conecte con tu audiencia. Esta semana se dedica a crear el universo visual que rodeará a tu lanzamiento.',
    subSteps: [
      { id: 'release-2-1', text: 'Actualizar las fotos de perfil y banners de todas las redes sociales con la nueva estética.', guideLink: 'branding' },
      { id: 'release-2-2', text: 'Realizar una sesión de fotos o crear gráficos que sigan la línea de la portada.', guideLink: 'branding' },
      { id: 'release-2-3', text: 'Crear un "Visualizer" o "Canvas" para Spotify.' },
      { id: 'release-2-4', text: 'Grabar o recopilar contenido de video corto (TikToks, Reels, Shorts) para las próximas semanas.' },
      { id: 'release-2-5', text: 'Diseñar un "Smart Link" o "Pre-Save Link" (ej. con Hypeddit, Toneden).' },
    ],
  },
  {
    id: 3,
    title: '4 SEMANAS ANTES: Distribución',
    subtitle: 'ENTREGANDO TU MÚSICA AL MUNDO',
    category: 'Distribución',
    philosophy: 'Este es el paso técnico más importante. Subir tu música con antelación te da la oportunidad de ser considerado para playlists editoriales, un factor clave para el éxito.',
    subSteps:
    [
      { id: 'release-3-1', text: 'Elegir una distribuidora digital (ej. DistroKid, TuneCore) y subir la canción, portada y metadatos.' },
      { id: 'release-3-2', text: 'Una vez que la canción sea aceptada, hacer el "pitch" a los editores de Spotify a través de Spotify for Artists.' },
      { id: 'release-3-3', text: 'Crear un Kit de Prensa Electrónico (EPK) con tu bio, fotos, enlaces y la nota de prensa.', guideLink: 'marketing' },
      { id: 'release-3-4', text: 'Empezar a enviar el EPK a blogs de música, radios y curadores de playlists independientes.' },
    ],
    note: 'El pitch a Spotify debe hacerse al menos 2-3 semanas antes del lanzamiento. ¡No dejes este paso para el final!',
  },
  {
    id: 4,
    title: '3 SEMANAS ANTES: Expectación',
    subtitle: 'INICIO DE LA CAMPAÑA DE PRE-SAVE',
    category: 'Marketing',
    philosophy: 'La conversación sobre tu lanzamiento empieza ahora. El objetivo es generar curiosidad y conseguir que tu audiencia más fiel guarde la canción antes de que salga.',
    subSteps: [
      { id: 'release-4-1', text: 'Anunciar oficialmente la fecha de lanzamiento y la portada en redes sociales.' },
      { id: 'release-4-2', text: 'Lanzar la campaña de Pre-Save/Pre-Add, explicando a tus fans por qué es importante.', guideLink: 'marketing' },
      { id: 'release-4-3', text: 'Compartir fragmentos de la canción o videos "detrás de las cámaras" de la creación.' },
      { id: 'release-4-4', text: 'Contactar a influencers o creadores de contenido que puedan encajar con tu música.' },
    ],
  },
  {
    id: 5,
    title: '2 SEMANAS ANTES: Aceleración',
    subtitle: 'INTENSIFICAR LA PROMOCIÓN',
    category: 'Marketing',
    philosophy: 'Con el lanzamiento a la vuelta de la esquina, es hora de aumentar la frecuencia y el alcance de tu mensaje.',
    subSteps: [
      { id: 'release-5-1', text: 'Comenzar a publicar el contenido de video corto creado en la semana 5.' },
      { id: 'release-5-2', text: 'Considerar una campaña de publicidad de pago (Meta Ads, TikTok Ads) dirigida a la página de Pre-Save.', 
        guideLink: 'marketing',
        subItems: [
          '**Presupuesto Bajo (~5-10€/día):** Campaña de tráfico al Smart Link/Pre-Save, segmentando a tus seguidores y audiencias similares.',
          '**Presupuesto Medio (~20-50€/día):** Añadir campaña de Video Views con un fragmento atractivo. Crear audiencias personalizadas de quienes interactuaron.',
          '**Presupuesto Alto (>50€/día):** Expandir a campañas de conversión. Usar múltiples creativos (videos, imágenes) para test A/B y optimizar.'
        ] },
      { id: 'release-5-3', text: 'Realizar un Instagram/TikTok Live para hablar de la canción y responder preguntas.' },
      { id: 'release-5-4', text: 'Si tienes un videoclip, anunciar la fecha de su estreno (usualmente el día del lanzamiento).' },
    ],
  },
  {
    id: 6,
    title: '1 SEMANA ANTES: Cuenta Atrás',
    subtitle: 'LA RECTA FINAL',
    category: 'Marketing',
    philosophy: 'Toda la energía se concentra en la fecha de lanzamiento. La comunicación debe ser constante y clara.',
    subSteps: [
      { id: 'release-6-1', text: 'Publicar contenido diario en redes sociales.',
        subItems: [
          '**7 días antes:** Post de "Falta 1 semana" con un nuevo fragmento.',
          '**5 días antes:** Inicia una cuenta atrás interactiva en stories de Instagram.',
          '**3 días antes:** Publica un video corto (Reel/TikTok) mostrando la emoción del lanzamiento.',
          '**1 día antes:** Anuncio final "MAÑANA". Haz un Live para conectar con tus fans y recordarlo.'
        ] },
      { id: 'release-6-2', text: 'Enviar un recordatorio a tu lista de correo (email marketing).' },
      { id: 'release-6-3', text: 'Confirmar cualquier entrevista, estreno en blogs o colaboración con influencers para la semana de lanzamiento.' },
      { id: 'release-6-4', text: 'Preparar todos los textos y enlaces que necesitarás para el día de lanzamiento.' },
    ],
  },
  {
    id: 7,
    title: 'SEMANA DE LANZAMIENTO',
    subtitle: '¡CELEBRACIÓN Y DIFUSIÓN!',
    category: 'Lanzamiento',
    philosophy: 'El trabajo duro da sus frutos. Hoy se trata de celebrar, agradecer y maximizar el alcance inicial, que es crucial para los algoritmos.',
    subSteps: [
      { id: 'release-7-1', text: 'Actualizar el enlace en la biografía de tus redes sociales al Smart Link con la canción ya disponible.' },
      { id: 'release-7-2', text: 'Publicar en todas tus redes sociales anunciando que la canción ya está disponible.' },
      { id: 'release-7-3', text: 'Pasar el día interactuando con los comentarios y compartiendo las publicaciones de los fans.' },
      { id: 'release-7-4', text: 'Enviar un email a tu lista de correo anunciando el lanzamiento.' },
      { id: 'release-7-5', text: 'Revisar Spotify for Artists y Apple Music for Artists para ver en qué playlists has entrado.' },
      { id: 'release-7-6', text: '(Post-Lanzamiento) Continuar promocionando la canción durante las siguientes semanas con nuevo contenido.' },
      { id: 'release-7-7', text: '(Post-Lanzamiento) Analizar las estadísticas para entender a tu audiencia y planificar futuros lanzamientos.' },
      { id: 'release-7-8', text: '(Post-Lanzamiento) Registrar la canción en tu administradora de publishing (ej. Songtrust) para la recaudación global.'}
    ],
  },
];