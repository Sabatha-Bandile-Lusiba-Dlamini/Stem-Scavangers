import React, { useState } from 'react';
import api from '../api';
import RecreationCard from './RecreationCard';
import type { Recreation } from '../types';

interface SearchResult {
  recreations: Recreation[];
  matchedArtists: string[];
}

interface Props {
  onArtistClick: (artist: string) => void;
  onRequestArtist: (artist: string) => void;
}

export default function SearchPanel({ onArtistClick, onRequestArtist }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
    } catch {
      setResults({ recreations: [], matchedArtists: [] });
    } finally {
      setLoading(false);
    }
  };

  const noResults = searched && results && results.recreations.length === 0;

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Search header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          search recreations
        </div>
        <form onSubmit={search} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="artist, track, or title…"
            style={{ flex: 1 }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !query.trim()}
          >
            {loading ? '…' : 'search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && results.recreations.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: '16px' }}>
            {results.recreations.length} recreation{results.recreations.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.recreations.map(r => (
              <RecreationCard
                key={r.id}
                recreation={r}
                onArtistClick={onArtistClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* No results state */}
      {noResults && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '32px 28px',
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}>
            No recreations found for <span style={{ color: 'var(--white)', fontStyle: 'italic' }}>"{query}"</span>
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            marginBottom: '20px',
          }}>
            Nobody's tackled this one yet. You can request the artist — if enough producers
            want it, someone will step up.
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onRequestArtist(query.trim())}
          >
            request "{query.trim()}"
          </button>
        </div>
      )}
    </div>
  );
}
