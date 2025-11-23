
import React, { useState, useMemo } from 'react';
import { headphoneProfiles } from '../data/headphoneData';
import { HeadphoneProfile, CalibrationState } from '../types';
import { HeadphonesIcon, CheckBadgeIcon, XIcon, SlidersIcon } from './icons';

interface HeadphoneCorrectionControlsProps {
    calibrationState: CalibrationState;
    onCalibrationChange: (newState: CalibrationState) => void;
}

const HeadphoneCorrectionControls: React.FC<HeadphoneCorrectionControlsProps> = ({ 
    calibrationState,
    onCalibrationChange
}) => {
    const { profile, amount, bypass } = calibrationState;
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    const filteredProfiles = useMemo(() => {
        if (!searchTerm) return headphoneProfiles;
        return headphoneProfiles.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSelectProfile = (newProfile: HeadphoneProfile) => {
        onCalibrationChange({ ...calibrationState, profile: newProfile });
        setIsDropdownOpen(false);
        setSearchTerm(''); 
    };

    const handleClearProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCalibrationChange({ ...calibrationState, profile: null });
        setSearchTerm('');
    };

    const handleAmountChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
        onCalibrationChange({ ...calibrationState, amount: Number(e.target.value) });
    };

    const toggleBypass = () => {
        onCalibrationChange({ ...calibrationState, bypass: !bypass });
    };

    return (
        <div className="w-full bg-[#121418] border border-theme-border rounded-lg p-4 shadow-lg mb-4 relative overflow-visible z-30">
            {/* Header with Status */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-theme-accent-secondary">
                    <HeadphonesIcon className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wide">Headphone Calibration</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${bypass ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-green-400 border-green-500/30 bg-green-500/10'}`}>
                        {bypass ? 'BYPASSED' : 'ACTIVE'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {/* Dropdown Selection */}
                <div className="flex-grow relative">
                    <div 
                        className="flex items-center bg-black/40 border border-theme-border rounded-md px-3 py-2 cursor-pointer hover:border-theme-accent transition-colors"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className={`flex-grow text-sm ${profile ? 'text-white font-semibold' : 'text-gray-500'}`}>
                            {profile ? profile.name : 'Seleccionar Modelo de Auriculares...'}
                        </span>
                        {profile ? (
                            <button onClick={handleClearProfile} className="p-1 hover:text-red-400 text-gray-500"><XIcon className="w-4 h-4"/></button>
                        ) : (
                            <SlidersIcon className="w-4 h-4 text-gray-500" />
                        )}
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d24] border border-theme-border rounded-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                            <div className="p-2 sticky top-0 bg-[#1a1d24] border-b border-theme-border">
                                <input 
                                    type="text" 
                                    placeholder="Buscar modelo..." 
                                    className="w-full bg-black/50 border border-theme-border rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-theme-accent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            {filteredProfiles.map(p => (
                                <div 
                                    key={p.name}
                                    className="px-3 py-2 text-sm text-gray-300 hover:bg-theme-accent/20 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => handleSelectProfile(p)}
                                >
                                    {p.name}
                                </div>
                            ))}
                            {filteredProfiles.length === 0 && (
                                <div className="px-3 py-4 text-xs text-gray-500 text-center">No se encontraron modelos.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {/* Amount Slider */}
                    <div className="flex flex-col w-32">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Correction</span>
                            <span>{amount}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={amount} 
                            onChange={handleAmountChangeLocal}
                            disabled={bypass || !profile}
                            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${bypass ? 'bg-gray-800' : 'bg-gray-700 accent-theme-accent-secondary'}`}
                        />
                    </div>

                    {/* Bypass Button */}
                    <button
                        onClick={toggleBypass}
                        disabled={!profile}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-lg
                            ${bypass 
                                ? 'bg-transparent border-gray-600 text-gray-600' 
                                : 'bg-theme-accent text-white border-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.4)]'
                            } ${!profile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Bypass Correction"
                    >
                        <CheckBadgeIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeadphoneCorrectionControls;
