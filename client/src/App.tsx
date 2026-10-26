import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Nav from './components/Nav';
import RecreationCard from './components/RecreationCard';
import UploadForm from './components/UploadForm';
import api from './api';

type Page = 'feed' | 'top' | 'profile';

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
  weighted_score?: number;
}

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('feed');
  const [viewingArtist, setViewingArtist] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [recreations, setRecreations] = useState<Recreation[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    window.scrollTo(0, 0);
    setFetching(true);

    let endpoint = '/recreations';
    if (page === 'top') endpoint = '/recreations/top';
    else if (page === 'profile') endpoint = `/recreations/user/${user.username}`;

    if (viewingArtist) endpoint = `/recreations/artist/${encodeURIComponent(viewingArtist)}`;
    if (viewingProfile) endpoint = `/recreations/user/${encodeURIComponent(viewingProfile)}`;

    api.get(endpoint)
      .then(res => setRecreations(res.data))
      .catch(() => setRecreations([]))
      .finally(() => setFetching(false));
  }, [page, viewingArtist, viewingProfile, refreshKey, user]);

  const handleNav = (p: Page) => {
    setPage(p);
    setViewingArtist(null);
    setViewingProfile(null);
    setShowUpload(false);
  };

  const handleArtistClick = (artist: string) => {
    setViewingArtist(artist);
    setViewingProfile(null);
  };

  const handleProfileClick = (username: string) => {
    setViewingProfile(username);
    setViewingArtist(null);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setPage('feed');
    setViewingArtist(null);
    setViewingProfile(null);
    setRefreshKey(k => k + 1);
  };

  if (loading) return null;
  if (!user) return <AuthForm />;

  const pageTitle = viewingArtist
    ? `recreations of ${viewingArtist}`
    : viewingProfile
    ? `${viewingProfile}'s recreations`
    : page === 'top'
    ? 'top rated'
    : page === 'profile'
    ? 'your recreations'
    : 'feed';

  return (
    <div>
      <Nav current={page} onNav={handleNav} />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Breadcrumb / title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            {(viewingArtist || viewingProfile) && (
              <button
                onClick={() => { setViewingArtist(null); setViewingProfile(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  display: 'block',
                  padding: 0,
                }}
              >
                ← back
              </button>
            )}
            <h1 style={{
              fontSize: '20px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.01em',
            }}>
              {pageTitle}
            </h1>
          </div>

          {(page === 'feed' || page === 'profile') && !viewingArtist && !viewingProfile && (
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(o => !o)}
            >
              {showUpload ? 'cancel' : '+ post'}
            </button>
          )}
        </div>

        {/* Upload form */}
        {showUpload && (
          <UploadForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        )}

        {/* Recreation list */}
        {fetching ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
            loading…
          </div>
        ) : recreations.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
            {page === 'profile' ? 'no recreations yet. post one.' : 'nothing here yet.'}
          </div>
        ) : (
          <>
            {page === 'top' && (
              <div className="label" style={{ marginBottom: '16px' }}>
                ranked by bayesian fidelity score
              </div>
            )}
            {recreations.map((r, i) => (
              <div key={r.id}>
                {page === 'top' && (
                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}>
                    #{i + 1}
                    {r.weighted_score ? ` — score ${Number(r.weighted_score).toFixed(2)}` : ''}
                  </div>
                )}
                <RecreationCard
                  recreation={r}
                  onArtistClick={handleArtistClick}
                  onProfileClick={handleProfileClick}
                  onDelete={() => setRefreshKey(k => k + 1)}
                />
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
