export interface Recreation {
  id: number;
  username: string;
  title: string;
  original_artist: string;
  original_track: string;
  audio_url: string;
  producer_notes: string | null;
  avg_fidelity: number | null;
  rating_count: number;
  created_at: string;
  weighted_score?: number;
}
