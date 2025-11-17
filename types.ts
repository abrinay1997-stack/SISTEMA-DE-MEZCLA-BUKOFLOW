export interface SubStep {
  id: string;
  text: string;
  subItems?: string[];
  isCustom?: boolean;
  guideLink?: 'marketing' | 'branding';
}

export interface SubStepFeedback {
  completed: boolean;
  userNotes?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export interface Step {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  philosophy?: string;
  method?: string;
  note?: string;
  subSteps: SubStep[];
}

export interface BudgetItem {
    id: string;
    category: 'Marketing' | 'Producción' | 'Video' | 'Diseño' | 'PR' | 'Otro';
    description: string;
    budgeted: number;
    actual: number;
}

export interface IncomeItem {
    id: string;
    category: 'Streaming' | 'Ventas Físicas' | 'Merchandising' | 'Sincronización' | 'Otro';
    description: string;
    projected: number;
    actual: number;
}

export interface PerformanceSummary {
    spotifyStreams: number;
    instagramFollowersGained: number;
    presaveCost: number;
    tiktokViews: number;
}

export interface ReleaseProfile {
  genre: string;
  audienceSize: 'starting' | 'growing' | 'established';
  budget: 'guerrilla' | 'indie' | 'advanced';
  launchType: 'single' | 'ep' | 'album';
  objective: 'streams' | 'followers' | 'press' | 'merch';
}

export interface Project {
  id:string;
  name: string;
  subStepFeedback: Map<string, SubStepFeedback>;
  isPriority: boolean;
  createdAt: number;
  icon: string;
  lastStepIndex: number;
  releaseDate?: string;
  steps: Step[];
  budget: BudgetItem[];
  income: IncomeItem[];
  advances: number;
  royaltySplits: string;
  activityLog: ActivityLogItem[];
  performanceSummary: PerformanceSummary;
  releaseProfile?: ReleaseProfile;
}

export interface ActivityLogItem {
    id: string;
    timestamp: number;
    text: string;
    author: string;
}

//--- Resource Center Types ---//
export interface Resource {
  id:string;
  title: string;
  description: string;
  type: 'download' | 'community' | 'faq' | 'link';
  url: string;
  category: 'distribucion' | 'marketing' | 'branding' | 'creacion' | 'comunidad' | 'preguntas';
  tags: string[];
  relatedSteps?: number[];
}

//--- Search Service Types ---//
export interface SearchResult {
    steps: Step[];
    guides: { guide: 'marketing' | 'branding'; term: string }[];
    faqs: Resource[];
}

// --- Guide Types (Generic for now) ---
export interface GuideSection {
    title: string;
    content: string | string[];
}

export interface GuideData {
    title: string;
    description: string;
    sections: GuideSection[];
}

// FIX: Added missing Spotify API types.
// --- Spotify API Types --- //
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyFollowers {
  href: null;
  total: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  popularity: number;
  followers: SpotifyFollowers;
  genres: string[];
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  album: SpotifyAlbum;
}

export interface SpotifyArtistDetails extends SpotifyArtist {
  topTracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  relatedArtists: SpotifyArtist[];
}