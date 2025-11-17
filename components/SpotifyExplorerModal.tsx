import React, { useState, useEffect, useCallback } from 'react';
import { XIcon, SpotifyIcon, LoaderIcon, SearchIcon, ArrowLeftIcon, LightbulbIcon } from './icons';
import { SpotifyApiError, searchArtists, getArtist, getArtistAlbums, getArtistTopTracks, getRelatedArtists } from '../services/spotifyService';
import type { SpotifyArtist, SpotifyArtistDetails } from '../types';

interface SpotifyExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLIENT_ID = 'd0e38192726948a1ab8b76a600045c20';
const REDIRECT_URI = window.location.href.split('?')[0].split('#')[0];
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// --- Funciones auxiliares para PKCE --- //
function generateRandomString(length: number): string {
    const array = new Uint32Array(length / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const SpotifyExplorerModal: React.FC<SpotifyExplorerModalProps> = ({ isOpen, onClose }) => {
    const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('spotify_access_token'));
    const [view, setView] = useState<'loading' | 'authenticate' | 'search' | 'details' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
    const [selectedArtist, setSelectedArtist] = useState<SpotifyArtistDetails | null>(null);

    const handleApiError = useCallback((err: unknown) => {
        if (err instanceof SpotifyApiError && err.status === 401) {
            localStorage.removeItem('spotify_access_token');
            setAccessToken(null);
            setError("Tu sesión de Spotify ha expirado. Por favor, inicia sesión de nuevo.");
            setView('authenticate');
        } else {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
            setView('error');
        }
    }, []);

    const authenticate = async () => {
        const codeVerifier = generateRandomString(128);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateRandomString(16);

        localStorage.setItem('pkce_code_verifier', codeVerifier);
        localStorage.setItem('pkce_state', state);

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            state: state,
            scope: '', // No scopes needed for public data
        });

        window.location.href = `${AUTH_URL}?${params.toString()}`;
    };

    useEffect(() => {
        if (!isOpen) return;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
            setView('loading');
            const storedState = localStorage.getItem('pkce_state');
            const codeVerifier = localStorage.getItem('pkce_code_verifier');

            window.history.replaceState({}, document.title, window.location.pathname); // Clean URL

            if (state !== storedState || !codeVerifier) {
                setError('Error de seguridad. El estado no coincide. Intenta de nuevo.');
                setView('error');
                return;
            }

            fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.access_token) {
                    localStorage.setItem('spotify_access_token', data.access_token);
                    setAccessToken(data.access_token);
                    setView('search');
                } else {
                    throw new Error(data.error_description || 'No se pudo obtener el token.');
                }
            })
            .catch(err => {
                setError(err.message);
                setView('error');
            });

        } else if (accessToken) {
            setView('search');
        } else {
            setView('authenticate');
        }
    }, [isOpen]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim() || !accessToken) return;
        setView('loading');
        setError(null);
        try {
            const results = await searchArtists(searchTerm, accessToken);
            setSearchResults(results);
            setView('search');
        } catch (err) {
            handleApiError(err);
        }
    };
    
    const handleSelectArtist = async (artistId: string) => {
        if (!accessToken) return;
        setView('loading');
        setError(null);
        try {
            const [details, topTracks, albums, relatedArtists] = await Promise.all([
                getArtist(artistId, accessToken),
                getArtistTopTracks(artistId, accessToken),
                getArtistAlbums(artistId, accessToken),
                getRelatedArtists(artistId, accessToken),
            ]);
            setSelectedArtist({ ...details, topTracks, albums, relatedArtists });
            setView('details');
        } catch (err) {
             handleApiError(err);
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return <div className="flex justify-center items-center h-full min-h-[300px]"><LoaderIcon className="w-12 h-12 text-theme-accent" /></div>;

            case 'authenticate':
                return (
                    <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <SpotifyIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Se requiere autorización</h2>
                        <p className="text-theme-text-secondary mb-6 max-w-sm">Para buscar artistas, necesitas iniciar sesión con tu cuenta de Spotify. Esta aplicación solo accederá a datos públicos.</p>
                        {error && <p className="text-red-400 mb-4">{error}</p>}
                        <button onClick={authenticate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
                            <SpotifyIcon className="w-5 h-5" />
                            Iniciar Sesión con Spotify
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <h2 className="text-xl font-bold mb-2 text-red-400">Ocurrió un Error</h2>
                        <p className="text-theme-text-secondary mb-6">{error}</p>
                        <button onClick={() => setView('authenticate')} className="bg-theme-accent hover:opacity-90 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                            Volver a Intentar
                        </button>
                    </div>
                );
            
            case 'search':
                return (
                    <div>
                        <form onSubmit={handleSearch} className="flex gap-2 p-4 border-b border-theme-border">
                            <div className="relative flex-grow">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar un artista (ej: Taylor Swift)"
                                    className="w-full pl-10 pr-4 py-2 bg-theme-bg border border-theme-border-secondary rounded-lg text-theme-text"
                                />
                            </div>
                            <button type="submit" className="py-2 px-4 bg-theme-accent hover:opacity-90 text-white font-semibold rounded-lg">Buscar</button>
                        </form>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {searchResults.length > 0 ? (
                                <ul className="space-y-2">
                                    {searchResults.map(artist => (
                                        <li key={artist.id} onClick={() => handleSelectArtist(artist.id)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                                            <img src={artist.images[2]?.url || artist.images[0]?.url || 'https://via.placeholder.com/64'} alt={artist.name} className="w-12 h-12 rounded-full object-cover bg-black/20" />
                                            <div className="flex-grow">
                                                <p className="font-bold">{artist.name}</p>
                                                <p className="text-sm text-theme-text-secondary">Popularidad: {artist.popularity}/100</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12 px-4 flex flex-col items-center">
                                    <SpotifyIcon className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
                                    <h3 className="text-lg text-theme-text">Busca un artista para ver sus datos.</h3>
                                    <p className="text-sm text-theme-text-secondary mt-1">Obtén métricas clave para informar tu estrategia de lanzamiento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'details': {
                if (!selectedArtist) {
                    setView('search');
                    return null;
                }
                const artist = selectedArtist;
                return (
                    <div>
                        <div className="p-4 border-b border-theme-border flex items-center gap-4">
                            <button onClick={() => { setSelectedArtist(null); setView('search'); }} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeftIcon className="w-6 h-6"/></button>
                            <h2 className="text-xl font-bold text-theme-accent-secondary">Detalles del Artista</h2>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-black/20 rounded-lg">
                                <img src={artist.images[1]?.url || artist.images[0]?.url || 'https://via.placeholder.com/128'} alt={artist.name} className="w-32 h-32 rounded-lg object-cover shadow-lg bg-black/20" />
                                <div className="flex-grow text-center sm:text-left">
                                    <h3 className="text-3xl font-bold">{artist.name}</h3>
                                    <p className="text-theme-text-secondary mt-1">{artist.genres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</p>
                                    <div className="flex justify-center sm:justify-start gap-6 mt-4">
                                        <div><p className="text-2xl font-bold text-theme-accent">{artist.followers.total.toLocaleString('es-ES')}</p><p className="text-xs text-theme-text-secondary uppercase">Seguidores</p></div>
                                        <div><p className="text-2xl font-bold text-theme-accent">{artist.popularity}/100</p><p className="text-xs text-theme-text-secondary uppercase">Popularidad</p></div>
                                    </div>
                                    <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">Ver en Spotify</a>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-lg text-theme-accent mb-2">Top Tracks</h4>
                                    <ul className="space-y-2">{artist.topTracks.slice(0, 5).map(track => <li key={track.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-md"><img src={track.album.images[2]?.url} className="w-10 h-10 rounded object-cover bg-black/20" alt={track.album.name} /><div><p className="font-semibold text-sm">{track.name}</p><p className="text-xs text-theme-text-secondary">Pop: {track.popularity}</p></div></li>)}</ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-theme-accent mb-2">Artistas Relacionados</h4>
                                    <ul className="space-y-2">{artist.relatedArtists.slice(0, 5).map(rel => <li key={rel.id} onClick={() => handleSelectArtist(rel.id)} className="flex items-center gap-3 p-2 bg-black/20 rounded-md cursor-pointer hover:bg-white/10"><img src={rel.images[2]?.url} className="w-10 h-10 rounded-full object-cover bg-black/20" alt={rel.name} /><div><p className="font-semibold text-sm">{rel.name}</p><p className="text-xs text-theme-text-secondary">Pop: {rel.popularity}</p></div></li>)}</ul>
                                </div>
                            </div>
                            <div>
                               <h4 className="font-bold text-lg text-theme-accent mb-2">Últimos Lanzamientos</h4>
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{artist.albums.slice(0, 8).map(album => <div key={album.id}><img src={album.images[1]?.url} className="w-full aspect-square rounded-md object-cover bg-black/20" alt={album.name} /><p className="font-semibold text-sm mt-1 truncate">{album.name}</p><p className="text-xs text-theme-text-secondary">{new Date(album.release_date).getFullYear()}</p></div>)}</div>
                            </div>
                        </div>
                    </div>
                );
            }
                
            default:
                return <p className="text-center text-theme-danger p-8">Ha ocurrido un error inesperado.</p>;
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in-backdrop" onClick={onClose}>
            <div className="relative bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg shadow-secondary-lg w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-2 pl-4 border-b border-theme-border-secondary">
                    <div className="flex items-center gap-2">
                        <SpotifyIcon className="w-6 h-6 text-green-500" />
                        <h1 className="font-bold text-theme-text">Análisis de Artistas</h1>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-theme-text-secondary hover:bg-white/10 hover:text-theme-text transition"><XIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-grow overflow-auto">
                   {renderContent()}
                </main>
                 <footer className="flex-shrink-0 p-2 text-center text-xs text-theme-text-secondary border-t border-theme-border">
                    Usa estos insights para refinar tus checklists de 'Branding' y 'Marketing'.
                </footer>
            </div>
        </div>
    );
};

export default SpotifyExplorerModal;