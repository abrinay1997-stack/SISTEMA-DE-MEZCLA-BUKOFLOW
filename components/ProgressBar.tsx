import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-theme-bg-secondary rounded-full h-4 border border-theme-border overflow-hidden shadow-accent-secondary">
      <div
        className="bg-gradient-to-r from-theme-accent to-theme-accent-secondary h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end"
        style={{ width: `${progress}%` }}
      >
        <span className="text-xs font-bold text-white pr-2">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;