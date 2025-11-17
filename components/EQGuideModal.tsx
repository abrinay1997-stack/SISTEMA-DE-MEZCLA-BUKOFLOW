import React from 'react';
import { marketingGuideData } from '../data/eqData';
import { XIcon } from './icons';
import type { GuideSection, Project } from '../types';

interface MarketingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const MarketingGuideModal: React.FC<MarketingGuideModalProps> = ({ isOpen, onClose, project }) => {
  if (!isOpen) return null;

  const renderContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
        return (
            <ul className="space-y-2 list-disc list-inside text-sm md:text-base">
                {content.map((item, index) => {
                    const parts = item.split('**');
                    return (
                        <li key={index}>
                            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-theme-accent">{part}</strong> : part)}
                        </li>
                    );
                })}
            </ul>
        );
    }
    return <p className="text-sm md:text-base leading-relaxed">{content}</p>;
  };

  return (
    <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full h-full max-w-4xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center border-b border-theme-border-secondary relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-theme-accent to-theme-accent-secondary bg-clip-text text-transparent uppercase tracking-wider">
            {marketingGuideData.title}
          </h1>
          <p className="text-theme-accent-secondary/80 text-sm">{marketingGuideData.description}</p>
           <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-4 sm:p-6 overflow-auto">
            <div className="space-y-6">
                {marketingGuideData.sections.map((section: GuideSection) => (
                    <div key={section.title} className="p-4 bg-black/20 border border-theme-border rounded-lg">
                        <h2 className="text-lg font-bold text-theme-accent mb-3">{section.title}</h2>
                        {renderContent(section.content)}
                    </div>
                ))}
            </div>
        </main>
      </div>
    </div>
  );
};

export default MarketingGuideModal;