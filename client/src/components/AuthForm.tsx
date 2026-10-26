import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Wordmark */}
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          fontFamily: 'var(--font-mono)',
          marginBottom: '6px',
          color: 'var(--white)',
        }}>
          BEATLOG
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '36px', fontFamily: 'var(--font-mono)' }}>
          recreate the underground
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
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
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px', justifyContent: 'center' }}>
              {loading ? '…' : mode === 'login' ? 'log in' : 'create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
