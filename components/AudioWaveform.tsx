
import React, { useRef, useEffect, useState } from 'react';

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

    const calculateSeekPosition = (clientX: number) => {
        if (!buffer || !canvasRef.current) return 0;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        // Clamp value between 0 and width
        const clampedX = Math.max(0, Math.min(x, rect.width));
        const clickProgress = clampedX / rect.width;
        return clickProgress * buffer.duration;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        const time = calculateSeekPosition(e.clientX);
        onSeek(time);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const time = calculateSeekPosition(e.clientX);
            onSeek(time);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Touch events support
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        const time = calculateSeekPosition(e.touches[0].clientX);
        onSeek(time);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const time = calculateSeekPosition(e.touches[0].clientX);
            onSeek(time);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full rounded cursor-crosshair opacity-90 hover:opacity-100 transition-opacity touch-none" 
            style={{ height: `${height}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        />
    );
};

export default AudioWaveform;
