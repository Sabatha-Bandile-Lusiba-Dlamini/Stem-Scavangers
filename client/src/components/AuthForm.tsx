import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PREVIEW_ITEMS = [
  { label: 'recreation of', artist: 'Vialice', track: 'Im Dancing', user: 'prodkid_sa', score: '4.8' },
  { label: 'recreation of', artist: 'DEADPAN', track: 'Competition Talk', user: 'subfreq', score: '4.2' },
  { label: 'recreation of', artist: 'Ho99o9', track: 'Incline', user: 'loopsmith', score: '3.9' },
  { label: 'recreation of', artist: 'Edward Skeletrix', track: 'Slave Niggas Still Shop At Niemans', user: 'wavdumper', score: '4.5' },
  { label: 'recreation of', artist: 'Pink Siifu', track: 'FKDUPBEZEL', user: 'prodkid_sa', score: '4.1' },
];

const TOP_REQUESTS = [
  { artist: 'Vialice', votes: 47 },
  { artist: 'DEADPAN', votes: 31 },
  { artist: 'Edward Skeletrix', votes: 28 },
  { artist: 'Pink Siifu', votes: 19 },
  { artist: 'Gao the Arsonist', votes: 14 },
];

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* LEFT — preview panel */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Wordmark */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-mono)',
            color: 'var(--white)',
            marginBottom: '4px',
          }}>
            Stem Scavangers
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            recreate the underground
          </div>
        </div>

        {/* What it is */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8, maxWidth: '380px' }}>
            Upload your beat recreations. Break down your stems. Rate how close other producers got.
            Build a reference library for underground music that doesn't exist anywhere else.
          </p>
        </div>

        {/* Recent recreations preview */}
        <div style={{ marginBottom: '40px' }}>
          <div className="label" style={{ marginBottom: '14px' }}>recent recreations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PREVIEW_ITEMS.map((item, i) => (
              <div key={i} style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                    {item.artist} — <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{item.track}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    by {item.user}
                  </div>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{ color: 'var(--white)' }}>▮▮▮▮</span><span style={{ color: 'var(--border-light)' }}>▮</span>
                  <span style={{ marginLeft: '4px' }}>{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most requested */}
        <div>
          <div className="label" style={{ marginBottom: '14px' }}>most requested</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TOP_REQUESTS.map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: '16px' }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.artist}</span>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {r.votes} votes
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — auth form */}
      <div style={{
        width: '400px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 36px',
      }}>
        <div style={{ width: '100%' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            marginBottom: '28px',
            color: 'var(--white)',
          }}>
            {mode === 'login' ? 'welcome back' : 'join Stem Scavangers'}
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === m ? '2px solid var(--white)' : '2px solid transparent',
                  color: mode === m ? 'var(--white)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'all 0.15s',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <input
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="error-msg">{error}</div>}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: '4px', justifyContent: 'center' }}
            >
              {loading ? '…' : mode === 'login' ? 'log in' : 'create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
