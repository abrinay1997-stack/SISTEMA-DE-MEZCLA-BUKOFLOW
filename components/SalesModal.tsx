
import React from 'react';
import { XIcon, CheckBadgeIcon, StarFilledIcon, ArrowUpTrayIcon } from './icons';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesModal: React.FC<SalesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const benefits = [
    "Asistene de Mezcla, un sistema paso a paso",
    "Gestion bilateral, un sistema 'En sincronía con tus mezclas'",
    "Guías interactivas de EQ, Compresión Reverb y Saturación, etc",
    "Gestión de proyectos y seguimiento de progreso",
    "Plantillas, Librerías, Samples, Presets, recursos y tutoriales",
    "Acceso a la comunidad y soporte",
    "Actualizaciones futuras incluidas"
  ];

  return (
    <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in-backdrop overflow-y-auto"
        onClick={onClose}
    >
      <div
        className="relative bg-[#0f1115] border border-theme-accent/30 rounded-2xl shadow-[0_0_50px_rgba(255,61,0,0.15)] w-full max-w-2xl flex flex-col animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image / Gradient */}
        <div className="relative h-32 bg-gradient-to-r from-theme-accent-secondary to-theme-accent overflow-hidden rounded-t-2xl flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute inset-0 bg-black/20"></div>
            <h2 className="relative z-10 text-3xl md:text-4xl font-extrabold text-white tracking-widest text-center uppercase drop-shadow-lg">
                Flow Academy
            </h2>
            <button 
                onClick={onClose} 
                className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-sm"
            >
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 md:p-8">
            {/* The Hook */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                    ¿Tus mezclas suenan "amateur"?
                </h3>
                <p className="text-lg text-gray-400">
                    Deja de adivinar. Convierte tu Home Studio en una cabina profesional con el sistema definitivo de mezcla guiada.
                </p>
            </div>

            {/* The Value Stack */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
                <h4 className="text-theme-accent font-bold uppercase text-sm tracking-wider mb-4 border-b border-white/10 pb-2">
                    Lo que obtienes hoy:
                </h4>
                <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-200">
                            <CheckBadgeIcon className="w-6 h-6 text-theme-success flex-shrink-0" />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pricing & Offer */}
            <div className="text-center mb-8">
                <div className="inline-block bg-theme-priority/20 border border-theme-priority/50 rounded-full px-4 py-1 mb-4">
                    <span className="text-theme-priority font-bold text-sm flex items-center gap-2">
                        <StarFilledIcon className="w-4 h-4" /> Oferta de Lanzamiento Global
                    </span>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <span className="text-2xl text-gray-500 line-through font-semibold">$47 USD</span>
                    <span className="text-5xl font-bold text-white">$17 USD</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Pago único. Acceso de por vida.</p>
            </div>

            {/* CTA Button */}
            <a 
                href="https://wa.link/x1oqhd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:to-[#075E54] text-white font-bold text-xl py-4 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,211,102,0.3)]"
            >
                <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:bg-transparent transition-all rounded-xl"></span>
                <span>Obtener Acceso Inmediato</span>
                <ArrowUpTrayIcon className="w-6 h-6 rotate-90" />
            </a>
            
            <p className="text-xs text-center text-gray-500 mt-4">
                Garantía de satisfacción. Precio ajustado para LATAM y USA.
            </p>

        </div>
      </div>
    </div>
  );
};

export default SalesModal;
