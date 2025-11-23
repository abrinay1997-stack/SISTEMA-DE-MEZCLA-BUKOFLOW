
import React from 'react';
import { XIcon, CheckBadgeIcon, StarFilledIcon, SpeakerWaveIcon, ChartBarIcon, ScaleIcon, BookOpenIcon, LockClosedIcon, WaveformIcon, HeadphonesIcon } from './icons';

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
        icon: <HeadphonesIcon className="w-5 h-5" />,
        title: "Headphone Calibration Engine",
        desc: "Corrección de respuesta de frecuencia para modelos profesionales de auriculares (Flat Response)."
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
      desc: "Sistema de test ciego con igualación automática de sonoridad (LUFS Match)."
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
        className="fixed inset-0 bg-black/95 z-[100] overflow-y-auto animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div className="flex min-h-full items-end md:items-center justify-center p-0 md:p-4">
        <div
            className="relative bg-[#0f1115] border-t md:border border-theme-border-secondary rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-4xl flex flex-col-reverse md:flex-row animate-scale-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Botón de cierre flotante */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-gray-400 hover:text-white transition-colors z-50 bg-black/50 rounded-full md:bg-transparent"
            >
                <XIcon className="w-6 h-6" />
            </button>

            {/* PANEL A (Izquierda en Desktop / Abajo en Móvil): Features / Información */}
            <div className="flex-1 p-5 md:p-8 bg-[#0f1115]">
                <div className="mb-6 pt-2 md:pt-0 hidden md:block">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center flex-wrap gap-2 mb-2">
                        <span className="bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent">FLOW ACADEMY</span>
                        <span className="text-[10px] md:text-xs font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">SUITE v1.0</span>
                    </h2>
                    <p className="text-gray-400 text-xs md:text-sm">
                        Herramientas de ingeniería y asistencia de mezcla para productores profesionales.
                    </p>
                </div>

                <h3 className="md:hidden text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 mt-2">Lo que incluye la Suite:</h3>

                {/* Lista con altura limitada en móvil para forzar el foco en el checkout */}
                <div className="grid grid-cols-1 gap-3 max-h-[300px] md:max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-white/5 border border-white/5 hover:border-theme-accent/30 transition-colors">
                            <div className="p-2 rounded bg-black/40 text-theme-accent-secondary flex-shrink-0">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-200">{feature.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mt-1">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PANEL B (Derecha en Desktop / Arriba en Móvil): Checkout / Pago */}
            {/* Este panel ahora aparece PRIMERO en el flujo visual móvil gracias a flex-col-reverse */}
            <div className="w-full md:w-80 bg-[#050608] border-b md:border-b-0 md:border-l border-theme-border-secondary/50 p-5 md:p-8 flex flex-col justify-between relative flex-shrink-0 z-10">
                
                <div className="absolute top-0 left-0 w-full h-1 md:w-1 md:h-full bg-gradient-to-r md:bg-gradient-to-b from-theme-accent to-theme-accent-secondary"></div>

                {/* Header visible solo en móvil dentro del panel de checkout */}
                <div className="md:hidden mb-6 pr-8">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent">FLOW ACADEMY</span>
                    </h2>
                    <p className="text-gray-400 text-xs">Suite de Ingeniería de Audio</p>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-4 hidden md:block">Licencia de Usuario</h3>
                    
                    <div className="space-y-3 md:space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Acceso Suite Completa</span>
                            <span className="text-white font-medium flex items-center gap-1"><CheckBadgeIcon className="w-4 h-4 text-theme-accent" /> Incluido</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Actualizaciones Futuras</span>
                            <span className="text-white font-medium flex items-center gap-1"><CheckBadgeIcon className="w-4 h-4 text-theme-accent" /> Incluido</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Suscripción Mensual</span>
                            <span className="text-theme-success font-bold bg-theme-success/10 px-2 py-0.5 rounded text-xs">NO TIENE</span>
                        </div>
                        <div className="h-px bg-white/10 my-3 md:my-4"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Precio Único</span>
                            <div className="text-right">
                                <span className="block text-xs text-gray-600 line-through mb-0.5">$197 USD</span>
                                <span className="text-3xl font-bold text-white">$67 <span className="text-sm font-normal text-gray-500">USD</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pb-2 md:pb-0">
                    <a 
                        href={PAYPAL_LINK}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-black hover:bg-gray-200 font-bold rounded-lg transition-all mb-3 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95"
                    >
                        <LockClosedIcon className="w-4 h-4" />
                        Comprar Licencia
                    </a>
                    <p className="text-[10px] text-center text-gray-500 leading-tight px-2">
                        Acceso inmediato de por vida. Pago seguro vía PayPal.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;
