import type { SuggestedTool } from '../types';

export const suggestedTools: Record<number, { title: string; tools: SuggestedTool[] }> = {
    6: {
        title: "Para limpieza espectral",
        tools: [
            { name: 'Paramétrico 🎛️', type: 'eq' },
            { name: 'Fase Lineal 💻', type: 'eq' },
        ]
    },
    7: {
        title: "Para control de dinámica",
        tools: [
            { name: 'FET ⚡', type: 'compression' },
            { name: 'VCA 🎚️', type: 'compression' },
            { name: 'Óptico 💡', type: 'compression' },
        ]
    },
    8: {
        title: "Para añadir color y carácter",
        tools: [
            { name: 'Analógico Pasivo 💡', type: 'eq' },
            { name: 'Analógico Activo ⚡', type: 'eq' },
        ]
    },
    9: {
        title: "Para profundidad y espacio",
        tools: [
            { name: 'Hall 🏛️', type: 'reverb' },
            { name: 'Plate ⚙️', type: 'reverb' },
            { name: 'Cinta 📼', type: 'saturation' },
            { name: 'Válvula 🔥', type: 'saturation' },
        ]
    },
    11: {
        title: "Para cohesión ('Glue')",
        tools: [
             { name: 'VCA 🎚️', type: 'compression' },
             { name: 'Paramétrico 🎛️', type: 'eq' },
             { name: 'Cinta 📼', type: 'saturation' },
        ]
    },
    12: {
        title: "Para el pulido final",
        tools: [
            { name: 'Fase Lineal 💻', type: 'eq' },
            { name: 'VCA 🎚️', type: 'compression' },
        ]
    }
};
