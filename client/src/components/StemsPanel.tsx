import React, { useEffect, useState } from 'react';
import WavePlayer from './WavePlayer';
import api from '../api';

interface Stem {
  id: number;
  name: string;
  audio_url: string;
  description: string | null;
  order_index: number;
}

interface Props {
  recreationId: number;
  isOwner: boolean;
  initialStems?: Stem[];
}

export default function StemsPanel({ recreationId, isOwner, initialStems }: Props) {
  const [stems, setStems] = useState<Stem[]>(initialStems || []);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialStems) {
      api.get(`/recreations/${recreationId}`).then(res => {
        setStems(res.data.stems || []);
      });
    }
  }, [recreationId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setUploading(true);
    setError('');

    const form = new FormData();
    form.append('audio', file);
    form.append('recreation_id', String(recreationId));
    form.append('name', name.trim());
    if (description.trim()) form.append('description', description.trim());
    form.append('order_index', String(stems.length));

    try {
      const res = await api.post('/stems', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStems(prev => [...prev, res.data]);
      setName('');
      setDescription('');
      setFile(null);
      setShowForm(false);
    } catch {
      setError('Upload failed. Check file size (max 30MB).');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (stemId: number) => {
    if (!confirm('Delete this stem?')) return;
    try {
      await api.delete(`/stems/${stemId}`);
      setStems(prev => prev.filter(s => s.id !== stemId));
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span className="label">stems</span>
        {isOwner && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => setShowForm(o => !o)}
          >
            {showForm ? 'cancel' : '+ add stem'}
          </button>
        )}
      </div>

      {stems.length === 0 && !showForm && (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', padding: '8px 0' }}>
          no stems uploaded yet
        </div>
      )}

      {stems.map(stem => (
        <div key={stem.id} style={{ marginBottom: '12px' }}>
          <WavePlayer url={stem.audio_url} label={stem.name} compact />
          {stem.description && (
            <div style={{
              marginTop: '6px',
              padding: '8px 12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              {stem.description}
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => handleDelete(stem.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                marginTop: '4px',
                padding: '2px 0',
              }}
            >
              remove stem
            </button>
          )}
        </div>
      ))}

      {showForm && (
        <form onSubmit={handleUpload} style={{
          marginTop: '12px',
          padding: '14px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <input
            placeholder="Stem name (e.g. 808, Kick, Melody)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="How you made this stem (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ minHeight: 60 }}
          />
          <input
            type="file"
            accept="audio/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            style={{ padding: '8px 0', border: 'none', background: 'none', color: 'var(--text-secondary)' }}
          />
          {error && <div className="error-msg">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={uploading}>
            {uploading ? 'uploading…' : 'upload stem'}
          </button>
        </form>
      )}
    </div>
  );
}
