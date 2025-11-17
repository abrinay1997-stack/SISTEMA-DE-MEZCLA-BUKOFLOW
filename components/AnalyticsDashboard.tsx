import React from 'react';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="w-full max-w-4xl p-4 md:p-6 bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg animate-fade-in-step space-y-6">
      <h2 className="text-lg font-bold text-theme-accent-secondary mb-2">Dashboard de Analíticas</h2>
      <div className="text-center p-8 bg-black/20 rounded-lg">
        <p className="text-theme-text-secondary">
          La funcionalidad de integración con Spotify ha sido desactivada.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;