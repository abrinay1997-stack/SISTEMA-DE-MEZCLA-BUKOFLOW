import type { SpotifyArtist, SpotifyTrack, SpotifyAlbum } from '../types';

const API_URL = 'https://api.spotify.com/v1';
const MARKET = 'PA'; // Panamá, as per original file

export class SpotifyApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

async function apiFetch(endpoint: string, token: string) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new SpotifyApiError('Token expirado.', 401);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new SpotifyApiError(errorData.error?.message || `Error ${response.status}`, response.status);
  }

  return response.json();
}

export async function searchArtists(query: string, token: string): Promise<SpotifyArtist[]> {
  if (!query) return [];
  const data = await apiFetch(`search?q=${encodeURIComponent(query)}&type=artist&limit=20`, token);
  return data.artists?.items || [];
}

export async function getArtist(artistId: string, token: string): Promise<SpotifyArtist> {
  return apiFetch(`artists/${artistId}`, token);
}

export async function getArtistTopTracks(artistId: string, token: string): Promise<SpotifyTrack[]> {
  const data = await apiFetch(`artists/${artistId}/top-tracks?market=${MARKET}`, token);
  return data.tracks || [];
}

export async function getArtistAlbums(artistId: string, token: string): Promise<SpotifyAlbum[]> {
  // Fetch both albums and singles
  const data = await apiFetch(`artists/${artistId}/albums?include_groups=album,single&limit=50&market=${MARKET}`, token);
  const items = data.items || [];
  // Simple de-duplication based on name, Spotify API can return multiple versions
  const uniqueAlbums = items.reduce((acc: SpotifyAlbum[], current: SpotifyAlbum) => {
    if (!acc.find(item => item.name.toLowerCase() === current.name.toLowerCase())) {
      acc.push(current);
    }
    return acc;
  }, []);
  return uniqueAlbums;
}

export async function getRelatedArtists(artistId: string, token: string): Promise<SpotifyArtist[]> {
  const data = await apiFetch(`artists/${artistId}/related-artists`, token);
  const artists = data.artists || [];
  return artists.slice(0, 12); // Limit to 12
}
