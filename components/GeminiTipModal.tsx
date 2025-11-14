import React from 'react';
import { LoaderIcon, XIcon } from './icons';

interface GeminiTipModalProps {
  isOpen: boolean;
  isLoading: boolean;
  tip: string;
  stepTitle: string;
  onClose: () => void;
}

const GeminiTipModal: React.FC<GeminiTipModalProps> = ({ isOpen, isLoading, tip, stepTitle, onClose }) => {
  if (!isOpen) return null;

  const formattedTip = tip.split('\n').map((line, index) => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return <li key={index} className="mb-2 list-disc ml-4">{line.substring(2)}</li>;
      }
      if (/^\d+\./.test(line.trim())) {
          return <li key={index} className="mb-2 list-decimal ml-4">{line.substring(line.indexOf('.') + 1)}</li>;
      }
      if (line.trim() === '') {
          return <br key={index} />;
      }
      return <p key={index} className="mb-4">{line}</p>;
  });


  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
          <h2 className="text-lg font-bold text-theme-accent-secondary">Consejo IA para: <span className="text-theme-accent">{stepTitle}</span></h2>
          <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <LoaderIcon className="w-16 h-16 text-theme-accent-secondary" />
              <p className="mt-4 text-theme-accent-secondary">Generando consejo profesional...</p>
            </div>
          ) : (
            <div className="prose prose-invert text-theme-text">
              {formattedTip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiTipModal;