
import React, { useEffect } from 'react';
import { XIcon } from './icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (() => void) | null;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  // Scroll Lock
  useEffect(() => {
    if (isOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-danger/50 rounded-lg shadow-danger-lg w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-theme-danger/30">
          <h2 className="text-lg font-bold text-theme-danger">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-theme-text">{message}</p>
        </div>
        <div className="flex justify-end gap-4 p-4 bg-black/20 border-t border-theme-danger/30 rounded-b-lg">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-md font-semibold transition-all duration-300 bg-gray-500/20 text-theme-text hover:bg-gray-500/30"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="py-2 px-4 rounded-md font-semibold transition-all duration-300 bg-theme-danger text-white hover:opacity-90"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
