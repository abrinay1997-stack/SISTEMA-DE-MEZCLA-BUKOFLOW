import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div 
        className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-4 background-grid"
    >
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-2">
                <LogoIcon className="w-20 h-20 text-theme-accent-secondary" />
            </div>
            <h1 className="text-3xl font-bold text-theme-accent-secondary tracking-widest uppercase">
                Ruta del Viajero
            </h1>
            <p className="text-lg text-theme-accent">Asistente de Mezcla Profesional</p>
        </header>
        
        <form 
            onSubmit={handleSubmit}
            className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border rounded-lg p-8 shadow-accent-secondary"
        >
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-theme-text">
              Clave de Acceso
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-theme-bg border-2 border-theme-border-secondary text-theme-text text-sm rounded-lg focus:ring-theme-accent-secondary focus:border-theme-accent-secondary block w-full p-2.5"
              required
            />
          </div>
          {error && <p className="text-theme-danger text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full text-white bg-gradient-to-r from-theme-accent to-theme-accent-secondary hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-theme-accent-secondary font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;