import React, { useState } from 'react';
import WavePlayer from './WavePlayer';
import FidelityRating from './FidelityRating';
import StemsPanel from './StemsPanel';
import api from '../api';
import { useAuth } from '../context/AuthContext';

interface Stem {
  id: number;
  name: string;
  audio_url: string;
  description: string | null;
  order_index: number;
}

interface Recreation {
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
  stems?: Stem[];
}

interface Props {
  recreation: Recreation;
  onArtistClick?: (artist: string) => void;
  onProfileClick?: (username: string) => void;
  onDelete?: () => void;
  showStems?: boolean;
}

export default function RecreationCard({
  recreation,
  onArtistClick,
  onProfileClick,
  onDelete,
  showStems = false,
}: Props) {
  const { user } = useAuth();
  const [stemsOpen, setStemsOpen] = useState(showStems);
  const [userRating, setUserRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id !== undefined && user.username === recreation.username;

  const handleRate = async (val: number) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await api.post('/ratings', { recreation_id: recreation.id, fidelity: val });
      setUserRating(val);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this recreation?')) return;
    try {
      await api.delete(`/recreations/${recreation.id}`);
      onDelete?.();
    } catch {
      // silent
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {recreation.title}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="label">recreation of</span>
            <button
              onClick={() => onArtistClick?.(recreation.original_artist)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '13px',
                padding: 0,
                cursor: onArtistClick ? 'pointer' : 'default',
                textDecoration: onArtistClick ? 'underline' : 'none',
                textUnderlineOffset: '3px',
                textDecorationColor: 'var(--border-light)',
              }}
            >
              {recreation.original_artist}
            </button>
            <span className="text-muted" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>–</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
              {recreation.original_track}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isOwner && (
            <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={handleDelete}>
              delete
            </button>
          )}
        </div>
      </div>

      {/* Player */}
      <WavePlayer url={recreation.audio_url} label="full beat" />

      {/* Producer notes */}
      {recreation.producer_notes && (
        <div style={{
          marginTop: '14px',
          padding: '12px 14px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}>
          <div className="label" style={{ marginBottom: '6px' }}>producer notes</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
            {recreation.producer_notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Community fidelity */}
          <div>
            <div className="label" style={{ marginBottom: '4px' }}>fidelity</div>
            <FidelityRating
              value={Math.round(recreation.avg_fidelity || 0)}
              readOnly
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {recreation.rating_count} rating{Number(recreation.rating_count) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rate it */}
          {user && !isOwner && (
            <div>
              <div className="label" style={{ marginBottom: '4px' }}>rate it</div>
              <FidelityRating
                value={userRating}
                onChange={submitting ? undefined : handleRate}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '5px 12px' }}
            onClick={() => setStemsOpen(o => !o)}
          >
            {stemsOpen ? 'hide stems' : `stems`} ↕
          </button>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => onProfileClick?.(recreation.username)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                cursor: onProfileClick ? 'pointer' : 'default',
              }}
            >
              {recreation.username}
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {fmt(recreation.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Stems panel */}
      {stemsOpen && (
        <div style={{ marginTop: '16px' }}>
          <hr className="divider" />
          <StemsPanel
            recreationId={recreation.id}
            isOwner={isOwner}
            initialStems={recreation.stems}
          />
        </div>
      )}
    </div>
  );
}
