
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioWaveformProps {
    buffer: AudioBuffer | null;
    progress: number; // current time in seconds
    onSeek: (time: number) => void;
    height?: number;
    color?: string;
    progressColor?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
    buffer, 
    progress, 
    onSeek, 
    height = 64, 
    color = '#4b5563', 
    progressColor = '#3b82f6' 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const draw = () => {
        if (!canvasRef.current || !buffer) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw dimensions
        const width = canvas.offsetWidth;
        canvas.width = width;
        canvas.height = height;

        const data = buffer.getChannelData(0); // Use left channel
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        
        // Draw Background Wave
        ctx.fillStyle = color;
        ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        // Draw Progress Overlay (Composite Operation)
        const progressWidth = (progress / buffer.duration) * width;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = progressColor;
        ctx.fillRect(0, 0, progressWidth, height);
    };

    useEffect(() => {
        draw();
    }, [buffer, progress, height, color, progressColor]);

    const calculateSeekPosition = useCallback((clientX: number) => {
        if (!buffer || !canvasRef.current) return 0;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        // Clamp value between 0 and width
        const clampedX = Math.max(0, Math.min(x, rect.width));
        const clickProgress = clampedX / rect.width;
        return clickProgress * buffer.duration;
    }, [buffer]);

    const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        
        let clientX = 0;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
        } else if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        
        const time = calculateSeekPosition(clientX);
        onSeek(time);
    }, [isDragging, calculateSeekPosition, onSeek]);

    const handleGlobalUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalUp);
            window.addEventListener('touchmove', handleGlobalMove);
            window.addEventListener('touchend', handleGlobalUp);
        } else {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, [isDragging, handleGlobalMove, handleGlobalUp]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // Prevent text selection
        setIsDragging(true);
        const time = calculateSeekPosition(e.clientX);
        onSeek(time);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        // e.preventDefault(); // Removed to allow scroll if needed, but touch-action: none in CSS handles it
        setIsDragging(true);
        const time = calculateSeekPosition(e.touches[0].clientX);
        onSeek(time);
    };

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full rounded cursor-crosshair opacity-90 hover:opacity-100 transition-opacity touch-none" 
            style={{ height: `${height}px`, touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        />
    );
};

export default AudioWaveform;
