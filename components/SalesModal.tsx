
import React from 'react';
import { XIcon, CheckBadgeIcon, StarFilledIcon, SpeakerWaveIcon, ChartBarIcon, ScaleIcon, BookOpenIcon, LockClosedIcon, WaveformIcon } from './icons';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesModal: React.FC<SalesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: <WaveformIcon className="w-5 h-5" />,
      title: "The Professional Mixing Route",
      desc: "Sistema integral de 14 etapas. Un flujo de trabajo guiado desde la emoción inicial hasta el master final."
    },
    {
      icon: <ChartBarIcon className="w-5 h-5" />,
      title: "Spectrum Target System",
      desc: "Curvas de referencia tonal para Trap, Urbano y Pop (Pink Noise Balance)."
    },
    {
      icon: <SpeakerWaveIcon className="w-5 h-5" />,
      title: "Acoustic Simulator",
      desc: "Motor de convolución para emular Coche, Club, TV y dispositivos móviles."
    },
    {
      icon: <ScaleIcon className="w-5 h-5" />,
      title: "Blind A/B Comparer",
      desc: "Sistema de test ciego con igualación automática de volumen (RMS Match)."
    },
    {
      icon: <BookOpenIcon className="w-5 h-5" />,
      title: "Interactive Pro Guides",
      desc: "Base de datos técnica de EQ, Compresión y Saturación por instrumento."
    },
    {
        icon: <StarFilledIcon className="w-5 h-5" />,
        title: "Workflow Tools",
        desc: "Calculadora BPM, Monitor de Fatiga Auditiva y Estimador de Entrega."
    },
    {
        icon: <CheckBadgeIcon className="w-5 h-5" />,
        title: "Production Vault",
        desc: "Acceso a librería de Contratos, Presets y Plantillas de sesión."
    }
  ];

  const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/66UP6BCRWS5K6";

  return (
    <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-[#0f1115] border border-theme-border-secondary rounded-lg shadow-2xl w-full max-w-4xl flex flex-col md:flex-row animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-theme-text-secondary hover:text-white transition-colors z-10"
        >
            <XIcon className="w-6 h-6" />
        </button>

        {/* Left Panel: The Product Suite */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                    <span className="bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent">FLOW ACADEMY</span>
                    <span className="text-xs font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">SUITE v1.0</span>
                </h2>
                <p className="text-gray-400 text-sm">
                    Herramientas de ingeniería y asistencia de mezcla para productores profesionales.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-md bg-white/5 border border-white/5 hover:border-theme-accent/30 transition-colors">
                        <div className="p-2 rounded bg-black/40 text-theme-accent-secondary">
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-200">{feature.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: The Checkout / License */}
        <div className="w-full md:w-80 bg-[#050608] border-l border-theme-border-secondary/50 p-8 flex flex-col justify-between relative">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-accent to-theme-accent-secondary"></div>

            <div>
                <h3 className="text-lg font-bold text-white mb-6">Licencia de Usuario</h3>
                
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Acceso Suite Completa</span>
                        <span className="text-white">Incluido</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Actualizaciones Futuras</span>
                        <span className="text-white">Incluido</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Suscripción Mensual</span>
                        <span className="text-theme-success font-bold">NO</span>
                    </div>
                    <div className="h-px bg-white/10 my-4"></div>
                    <div className="flex justify-between items-end">
                        <span className="text-gray-400 text-sm">Precio Único</span>
                        <div className="text-right">
                            <span className="block text-xs text-gray-600 line-through mb-0.5">$197 USD</span>
                            <span className="text-3xl font-bold text-white">$67 <span className="text-sm font-normal text-gray-500">USD</span></span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <a 
                    href={PAYPAL_LINK}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black hover:bg-gray-200 font-bold rounded transition-all mb-3"
                >
                    <LockClosedIcon className="w-4 h-4" />
                    Comprar Licencia
                </a>
                <p className="text-[10px] text-center text-gray-600 leading-tight">
                    Pago único seguro procesado por PayPal. Acceso inmediato tras la confirmación. Garantía de devolución de 14 días.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;
