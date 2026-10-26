export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Recreation {
  id: number;
  user_id: number;
  username: string;
  title: string;
  original_artist: string;
  original_track: string;
  audio_url: string;
  producer_notes: string | null;
  created_at: string;
  avg_fidelity?: number;
  rating_count?: number;
  stems?: Stem[];
}

export interface Stem {
  id: number;
  recreation_id: number;
  name: string;
  audio_url: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Rating {
  id: number;
  user_id: number;
  recreation_id: number;
  fidelity: number;
  created_at: string;
}

export interface TopRecreation extends Recreation {
  weighted_score: number;
}

export interface ArtistPage {
  original_artist: string;
  recreations: Recreation[];
}
