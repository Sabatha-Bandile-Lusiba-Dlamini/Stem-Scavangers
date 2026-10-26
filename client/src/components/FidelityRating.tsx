import React, { useState } from 'react';

interface FidelityRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}

const BLOCKS = ['▪', '▪', '▪', '▪', '▪'];

export default function FidelityRating({ value, onChange, readOnly = false }: FidelityRatingProps) {
  const [hover, setHover] = useState(0);

  const display = hover || value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {BLOCKS.map((_, i) => {
        const filled = i < display;
        return (
          <span
            key={i}
            onClick={() => !readOnly && onChange?.(i + 1)}
            onMouseEnter={() => !readOnly && setHover(i + 1)}
            onMouseLeave={() => !readOnly && setHover(0)}
            style={{
              fontSize: '18px',
              color: filled ? 'var(--white)' : 'var(--border-light)',
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'color 0.1s',
              userSelect: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ▮
          </span>
        );
      })}
      <span style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        marginLeft: '6px',
      }}>
        {display ? `${display}/5` : '—'}
      </span>
    </div>
  );
}
