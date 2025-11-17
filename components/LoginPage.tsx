import React from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div 
        className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-4 background-grid"
    >
      <div className="w-full max-w-sm text-center">
        <header className="mb-8">
            <div className="flex justify-center items-center gap-4 mb-2">
                <img alt="Logo" className="w-24 h-auto filter drop-shadow-[0_0_10px_var(--theme-accent)]" src="https://hostedimages-cdn.aweber-static.com/MjM0MTQ0NQ==/thumbnail/188302f5ca5241bd9111d44862883f63.png" />
            </div>
            <h1 className="text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase">
                Asistente Musical
            </h1>
            <p className="text-lg text-theme-accent">Tu estudio creativo, potenciado.</p>
        </header>
        
        <div 
            className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg p-8 shadow-accent-secondary"
        >
          <p className="text-theme-text mb-6">
            Una guía completa para planificar, promocionar y ejecutar el lanzamiento de tu próxima canción.
          </p>
          <button
            onClick={onLoginSuccess}
            className="w-full text-white bg-gradient-to-r from-theme-accent to-theme-accent-secondary hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-theme-accent-secondary font-medium rounded-lg text-lg px-5 py-3 text-center transition-transform transform hover:scale-105"
          >
            Empezar Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;