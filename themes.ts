export type ThemeName =
  | 'cyberpunk'
  | 'analog'
  | 'light'
  | 'dark'
  | 'vintage'
  | 'neonwave'
  | 'forest';

export interface Theme {
  name: ThemeName;
  label: string;
  colors: {
    '--theme-bg': string;
    '--theme-bg-secondary': string;
    '--theme-text': string;
    '--theme-text-secondary': string;
    '--theme-accent': string;
    '--theme-accent-secondary': string;
    '--theme-border': string;
    '--theme-border-secondary': string;
    '--theme-success': string;
    '--theme-success-text': string;
    '--theme-danger': string;
    '--theme-priority': string;
    '--theme-shadow-accent': string;
    '--theme-shadow-secondary': string;
    '--theme-shadow-success': string;
    '--theme-shadow-danger': string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    colors: {
      '--theme-bg': '#0a101f',
      '--theme-bg-secondary': 'rgba(29, 36, 56, 0.85)',
      '--theme-text': '#e5e7eb',
      '--theme-text-secondary': '#9ca3af',
      '--theme-accent': '#d946ef',
      '--theme-accent-secondary': '#06b6d4',
      '--theme-border': 'rgba(6, 182, 212, 0.3)',
      '--theme-border-secondary': 'rgba(217, 70, 239, 0.3)',
      '--theme-success': '#22c55e',
      '--theme-success-text': '#bbf7d0',
      '--theme-danger': '#ef4444',
      '--theme-priority': '#facc15',
      '--theme-shadow-accent': 'rgba(217, 70, 239, 0.2)',
      '--theme-shadow-secondary': 'rgba(6, 182, 212, 0.2)',
      '--theme-shadow-success': 'rgba(74, 222, 128, 0.3)',
      '--theme-shadow-danger': 'rgba(255, 70, 70, 0.3)',
    },
  },

  analog: {
    name: 'analog',
    label: 'Estudio Analógico',
    colors: {
      '--theme-bg': '#2a211c',
      '--theme-bg-secondary': 'rgba(61, 50, 44, 0.8)',
      '--theme-text': '#e4d8c5',
      '--theme-text-secondary': '#a89d8d',
      '--theme-accent': '#f59e0b',
      '--theme-accent-secondary': '#d97706',
      '--theme-border': 'rgba(217, 119, 6, 0.3)',
      '--theme-border-secondary': 'rgba(245, 158, 11, 0.3)',
      '--theme-success': '#84cc16',
      '--theme-success-text': '#d9f99d',
      '--theme-danger': '#dc2626',
      '--theme-priority': '#fde047',
      '--theme-shadow-accent': 'rgba(245, 158, 11, 0.2)',
      '--theme-shadow-secondary': 'rgba(217, 119, 6, 0.2)',
      '--theme-shadow-success': 'rgba(132, 204, 22, 0.3)',
      '--theme-shadow-danger': 'rgba(220, 38, 38, 0.3)',
    },
  },

  light: {
    name: 'light',
    label: 'Modo Claro',
    colors: {
      '--theme-bg': '#f3f4f6',
      '--theme-bg-secondary': 'rgba(243, 244, 246, 0.9)',
      '--theme-text': '#1f2937',
      '--theme-text-secondary': '#4b5563',
      '--theme-accent': '#7c3aed',
      '--theme-accent-secondary': '#0ea5e9',
      '--theme-border': 'rgba(14, 165, 233, 0.3)',
      '--theme-border-secondary': 'rgba(124, 58, 237, 0.3)',
      '--theme-success': '#16a34a',
      '--theme-success-text': '#166534',
      '--theme-danger': '#dc2626',
      '--theme-priority': '#f59e0b',
      '--theme-shadow-accent': 'rgba(124, 58, 237, 0.2)',
      '--theme-shadow-secondary': 'rgba(14, 165, 233, 0.2)',
      '--theme-shadow-success': 'rgba(22, 163, 74, 0.3)',
      '--theme-shadow-danger': 'rgba(220, 38, 38, 0.3)',
    },
  },

  // -----------------------------------------------------
  // NUEVOS TEMAS
  // -----------------------------------------------------

  dark: {
    name: 'dark',
    label: 'Studio Nocturno',
    colors: {
      '--theme-bg': '#0d0d0f',
      '--theme-bg-secondary': 'rgba(28, 28, 32, 0.85)',
      '--theme-text': '#e5e5e5',
      '--theme-text-secondary': '#9b9b9b',
      '--theme-accent': '#3b82f6',
      '--theme-accent-secondary': '#1d4ed8',
      '--theme-border': 'rgba(59, 130, 246, 0.25)',
      '--theme-border-secondary': 'rgba(29, 78, 216, 0.25)',
      '--theme-success': '#22c55e',
      '--theme-success-text': '#bbf7d0',
      '--theme-danger': '#ef4444',
      '--theme-priority': '#eab308',
      '--theme-shadow-accent': 'rgba(59, 130, 246, 0.25)',
      '--theme-shadow-secondary': 'rgba(29, 78, 216, 0.25)',
      '--theme-shadow-success': 'rgba(34, 197, 94, 0.3)',
      '--theme-shadow-danger': 'rgba(239, 68, 68, 0.3)',
    },
  },

  vintage: {
    name: 'vintage',
    label: 'Retro Consola',
    colors: {
      '--theme-bg': '#1a1a14',
      '--theme-bg-secondary': 'rgba(50, 50, 40, 0.8)',
      '--theme-text': '#e5e2c6',
      '--theme-text-secondary': '#bab7a0',
      '--theme-accent': '#a3e635',
      '--theme-accent-secondary': '#65a30d',
      '--theme-border': 'rgba(163, 230, 53, 0.25)',
      '--theme-border-secondary': 'rgba(101, 163, 13, 0.25)',
      '--theme-success': '#4ade80',
      '--theme-success-text': '#d9f99d',
      '--theme-danger': '#ec4899',
      '--theme-priority': '#facc15',
      '--theme-shadow-accent': 'rgba(163, 230, 53, 0.2)',
      '--theme-shadow-secondary': 'rgba(101, 163, 13, 0.2)',
      '--theme-shadow-success': 'rgba(74, 222, 128, 0.3)',
      '--theme-shadow-danger': 'rgba(236, 72, 153, 0.3)',
    },
  },

  neonwave: {
    name: 'neonwave',
    label: 'Synthwave',
    colors: {
      '--theme-bg': '#130720',
      '--theme-bg-secondary': 'rgba(32, 15, 54, 0.85)',
      '--theme-text': '#f1e9ff',
      '--theme-text-secondary': '#bbaed1',
      '--theme-accent': '#ff4ecd',
      '--theme-accent-secondary': '#00e5ff',
      '--theme-border': 'rgba(255, 78, 205, 0.25)',
      '--theme-border-secondary': 'rgba(0, 229, 255, 0.25)',
      '--theme-success': '#4ade80',
      '--theme-success-text': '#d1fadf',
      '--theme-danger': '#fb7185',
      '--theme-priority': '#facc15',
      '--theme-shadow-accent': 'rgba(255, 78, 205, 0.2)',
      '--theme-shadow-secondary': 'rgba(0, 229, 255, 0.2)',
      '--theme-shadow-success': 'rgba(74, 222, 128, 0.3)',
      '--theme-shadow-danger': 'rgba(251, 113, 133, 0.3)',
    },
  },

  forest: {
    name: 'forest',
    label: 'Bosque Profundo',
    colors: {
      '--theme-bg': '#0d1c16',
      '--theme-bg-secondary': 'rgba(22, 38, 30, 0.85)',
      '--theme-text': '#e3f2e9',
      '--theme-text-secondary': '#a8c3b3',
      '--theme-accent': '#34d399',
      '--theme-accent-secondary': '#059669',
      '--theme-border': 'rgba(52, 211, 153, 0.25)',
      '--theme-border-secondary': 'rgba(5, 150, 105, 0.25)',
      '--theme-success': '#4ade80',
      '--theme-success-text': '#d1fadf',
      '--theme-danger': '#ef4444',
      '--theme-priority': '#fcd34d',
      '--theme-shadow-accent': 'rgba(52, 211, 153, 0.2)',
      '--theme-shadow-secondary': 'rgba(5, 150, 105, 0.2)',
      '--theme-shadow-success': 'rgba(74, 222, 128, 0.3)',
      '--theme-shadow-danger': 'rgba(239, 68, 68, 0.3)',
    },
  },
};