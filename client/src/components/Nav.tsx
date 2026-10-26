import React from 'react';
import { useAuth } from '../context/AuthContext';

type Page = 'feed' | 'top' | 'profile';

interface Props {
  current: Page;
  onNav: (page: Page) => void;
}

export default function Nav({ current, onNav }: Props) {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '52px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <button
          onClick={() => onNav('feed')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--white)',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
          }}
        >
          Stem Scavangers
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'feed', label: 'feed' },
            { key: 'top', label: 'top' },
          ] as { key: Page; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onNav(key)}
              style={{
             
                border: 'none',
                padding: '6px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: current === key ? 'var(--white)' : 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: '4px',
                background: current === key ? 'var(--surface)' : 'transparent',
              } as React.CSSProperties}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => onNav('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: current === 'profile' ? 'var(--white)' : 'var(--text-muted)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
        >
          {user?.username}
        </button>
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          log out
        </button>
      </div>
    </nav>
  );
}
