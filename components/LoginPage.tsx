
import React, { useState } from 'react';
import { LogoIcon, StarIcon } from './icons';
import SalesModal from './SalesModal';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: The comma operator was used incorrectly. Changed to a logical OR to check for multiple valid passwords.
    if (password === '1997' || password === 'avalon') {
      onLoginSuccess();
    } else {
      setError('Clave de acceso incorrecta.');
      setPassword('');
    }
  };

  return (
    <>
      <div 
          className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-4 background-grid"
      >
        <div className="w-full max-w-sm relative z-10">
          <header className="text-center mb-8">
              <div className="flex justify-center items-center gap-4 mb-2">
                  <LogoIcon className="w-20 h-20 text-theme-accent-secondary" />
              </div>
              <h1 className="text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase">
                  FLOW ACADEMY
              </h1>
              <p className="text-lg text-theme-accent">Eleva tu sonido, desatado al infinito.</p>
          </header>
          
          <div className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg p-8 shadow-accent-secondary mb-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-theme-text">
                  Clave de Acceso
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu pin..."
                  className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5 placeholder-gray-600"
                  required
                />
              </div>
              {error && <p className="text-theme-danger text-sm mb-4 text-center">{error}</p>}
              <button
                type="submit"
                className="w-full text-white bg-gradient-to-r from-theme-accent to-theme-accent-secondary hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-theme-accent-secondary font-medium rounded-lg text-sm px-5 py-2.5 text-center shadow-lg shadow-theme-accent/20 transition-all"
              >
                Acceder
              </button>
            </form>
          </div>

          {/* Marketing / Sales Section */}
          <div className="text-center">
            <p className="text-theme-text-secondary text-sm mb-3">¿Aún no tienes acceso?</p>
            <button
              onClick={() => setIsSalesModalOpen(true)}
              className="group relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-br from-theme-accent to-theme-accent-secondary group-hover:from-theme-accent group-hover:to-theme-accent-secondary hover:text-white text-white focus:ring-4 focus:outline-none focus:ring-theme-accent/50 w-full"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-gray-900 rounded-md group-hover:bg-opacity-0 w-full flex items-center justify-center gap-2">
                <StarIcon className="w-4 h-4 text-theme-priority animate-pulse" />
                Obtén Acceso
              </span>
            </button>
          </div>

        </div>
      </div>
      
      <SalesModal 
        isOpen={isSalesModalOpen} 
        onClose={() => setIsSalesModalOpen(false)} 
      />
    </>
  );
};

export default LoginPage;
