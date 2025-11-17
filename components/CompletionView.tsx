import React from 'react';
import { CheckBadgeIcon } from './icons';

interface CompletionViewProps {
  onGoToHub: () => void;
}

const CompletionView: React.FC<CompletionViewProps> = ({ onGoToHub }) => {
  return (
    <div className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-success/50 rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all duration-300 w-full max-w-4xl shadow-success-lg animate-fade-in-step">
      <CheckBadgeIcon className="w-24 h-24 text-theme-success mb-6" />
      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-theme-success to-theme-accent-secondary bg-clip-text text-transparent mb-4">
        ¡Lanzamiento Planificado!
      </h2>
      <p className="text-lg text-theme-text mb-8 max-w-lg">
        ¡Felicidades! Has completado todos los pasos de la Ruta del Lanzamiento. ¡Mucha suerte con tu nueva música!
      </p>
      <button
        onClick={onGoToHub}
        className="py-3 px-8 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-theme-accent to-theme-accent-secondary text-white hover:shadow-lg hover:shadow-accent-secondary/30 transform hover:-translate-y-1"
      >
        Volver al Hub de Lanzamientos
      </button>
    </div>
  );
};

export default CompletionView;
