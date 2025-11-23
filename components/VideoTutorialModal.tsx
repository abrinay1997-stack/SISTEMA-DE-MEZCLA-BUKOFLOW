
import React from 'react';
import { XIcon } from './icons';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ isOpen, onClose, videoUrl, title }) => {
  if (!isOpen) return null;

  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
      if (url.includes('vimeo.com')) {
        const videoId = new URL(url).pathname.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      }
      if (url.includes('youtube.com/watch')) {
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      if (url.includes('youtu.be')) {
        const videoId = new URL(url).pathname.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    } catch (error) {
      console.error("Invalid video URL:", error);
      return null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 animate-fade-in-backdrop"
        onClick={onClose}
    >
      <div
        className="relative bg-theme-bg backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-accent-lg w-full max-w-4xl flex flex-col animate-scale-up pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-theme-border-secondary">
          <h2 className="text-md font-bold text-theme-accent-secondary truncate pr-8">Tutorial: <span className="text-theme-text">{title}</span></h2>
          <button onClick={onClose} className="p-4 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-2 bg-black">
          {embedUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-b-md"
              ></iframe>
            </div>
          ) : (
            <div className="aspect-video w-full flex items-center justify-center bg-black text-theme-danger p-4">
              <p>Error: No se pudo cargar el video. La URL no es compatible o es inválida.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTutorialModal;
