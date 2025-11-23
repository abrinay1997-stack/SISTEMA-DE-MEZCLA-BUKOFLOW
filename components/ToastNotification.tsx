
import React, { useEffect, useState } from 'react';
import { CheckBadgeIcon, XIcon } from './icons';

interface ToastNotificationProps {
    title: string;
    message: string;
    onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ title, message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 4500);

        return () => clearTimeout(timer);
    }, []);

    const handleAnimationEnd = () => {
        if (isExiting) {
            onClose();
        }
    };
    
    const handleCloseClick = () => {
      setIsExiting(true);
    }

    return (
        <div 
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[80] w-full max-w-sm ${isExiting ? 'animate-fade-out-up' : 'animate-slide-in-down'}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className="bg-theme-bg border border-theme-success/50 rounded-lg shadow-success-lg p-4 flex items-start gap-4">
                <div className="flex-shrink-0">
                    <CheckBadgeIcon className="w-8 h-8 text-theme-success" />
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-theme-success">{title}</h3>
                    <p className="text-sm text-theme-text">{message}</p>
                </div>
                <div className="flex-shrink-0">
                    <button onClick={handleCloseClick} className="p-1 rounded-full text-theme-text-secondary hover:bg-white/10">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastNotification;
