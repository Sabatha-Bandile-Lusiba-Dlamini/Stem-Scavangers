import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WavePlayerProps {
  url: string;
  label?: string;
  compact?: boolean;
}

export default function WavePlayer({ url, label, compact = false }: WavePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#333333',
      progressColor: '#ffffff',
      cursorColor: '#555555',
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      height: compact ? 36 : 56,
      normalize: true,
      interact: true,
    });

    ws.load(url);

    ws.on('ready', () => {
      setReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url, compact]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: compact ? '10px 12px' : '14px 16px',
    }}>
      {label && (
        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          {label}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={togglePlay}
          disabled={!ready}
          style={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: '50%',
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: ready ? 'var(--white)' : 'var(--text-muted)',
            fontSize: compact ? 14 : 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div ref={containerRef} style={{ width: '100%' }} />
        </div>

        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          flexShrink: 0,
          minWidth: 72,
          textAlign: 'right',
        }}>
          {ready ? `${fmt(currentTime)} / ${fmt(duration)}` : '—'}
        </div>
      </div>
    </div>
  );
}
