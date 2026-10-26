import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

interface ArtistRequest {
  id: number;
  artist_name: string;
  submitted_by: string;
  votes: string;
  created_at: string;
}

interface Props {
  prefillArtist?: string;
  onPrefillConsumed?: () => void;
}

export default function RequestsSidebar({ prefillArtist, onPrefillConsumed }: Props) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ArtistRequest[]>([]);
  const [myVotes, setMyVotes] = useState<Set<number>>(new Set());
  const [newArtist, setNewArtist] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [votingId, setVotingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch {}
  }, []);

  const loadMyVotes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/requests/myvotes');
      setMyVotes(new Set(res.data));
    } catch {}
  }, [user]);

  useEffect(() => {
    load();
    loadMyVotes();
  }, [load, loadMyVotes]);

  // Pre-fill from search "no results" CTA
  useEffect(() => {
    if (prefillArtist) {
      setNewArtist(prefillArtist);
      onPrefillConsumed?.();
    }
  }, [prefillArtist, onPrefillConsumed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.trim()) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await api.post('/requests', { artist_name: newArtist.trim() });
      if (res.data.merged) {
        setSubmitMsg(`"${newArtist.trim()}" already requested — added your vote`);
      } else {
        setSubmitMsg(`"${newArtist.trim()}" added to requests`);
      }
      setNewArtist('');
      await load();
      await loadMyVotes();
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitMsg(''), 3000);
    }
  };

  const toggleVote = async (requestId: number) => {
    if (!user || votingId === requestId) return;
    setVotingId(requestId);
    const hasVoted = myVotes.has(requestId);
    try {
      if (hasVoted) {
        await api.delete(`/requests/${requestId}/vote`);
        setMyVotes(prev => { const s = new Set(prev); s.delete(requestId); return s; });
      } else {
        await api.post(`/requests/${requestId}/vote`);
        setMyVotes(prev => new Set([...prev, requestId]));
      }
      await load();
    } catch {} finally {
      setVotingId(null);
    }
  };

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      height: 'calc(100vh - 52px)',
      overflowY: 'auto',
      padding: '20px 16px',
      position: 'sticky',
      top: '52px',
    }}>
      <div style={{
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '16px',
      }}>
        most requested
      </div>

      {/* Submit form */}
      {user && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <input
            value={newArtist}
            onChange={e => setNewArtist(e.target.value)}
            placeholder="request an artist…"
            style={{ width: '100%', fontSize: '12px', marginBottom: '6px' }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !newArtist.trim()}
            style={{ width: '100%', justifyContent: 'center', fontSize: '11px', padding: '6px' }}
          >
            {submitting ? '…' : 'submit'}
          </button>
          {submitMsg && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '6px',
              lineHeight: 1.4,
            }}>
              {submitMsg}
            </div>
          )}
        </form>
      )}

      <div className="divider" />

      {/* Ranked list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
        {requests.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            no requests yet
          </div>
        )}
        {requests.map((req, i) => {
          const voted = myVotes.has(req.id);
          const voteCount = Number(req.votes);
          return (
            <div key={req.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Rank */}
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                width: '14px',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>

              {/* Artist name */}
              <span style={{
                flex: 1,
                fontSize: '12px',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }} title={req.artist_name}>
                {req.artist_name}
              </span>

              {/* Vote button / count */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                {user ? (
                  <button
                    onClick={() => toggleVote(req.id)}
                    disabled={votingId === req.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '10px',
                      color: voted ? 'var(--white)' : 'var(--text-muted)',
                      lineHeight: 1,
                    }}
                    title={voted ? 'remove vote' : 'vote'}
                  >
                    {voted ? '▲' : '△'}
                  </button>
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>△</span>
                )}
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: voted ? 'var(--white)' : 'var(--text-muted)',
                }}>
                  {voteCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
