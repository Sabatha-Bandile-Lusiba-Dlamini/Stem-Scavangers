import React, { useState } from 'react';
import api from '../api';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UploadForm({ onSuccess, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [track, setTrack] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const form = new FormData();
    form.append('audio', file);
    form.append('title', title.trim());
    form.append('original_artist', artist.trim());
    form.append('original_track', track.trim());
    if (notes.trim()) form.append('producer_notes', notes.trim());

    try {
      await api.post('/recreations', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Max file size is 50MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>post a recreation</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div className="label" style={{ marginBottom: '6px' }}>your title for this recreation</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='e.g. "MAD MAX recreation v2"'
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div className="label" style={{ marginBottom: '6px' }}>original artist</div>
            <input
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="jaykatana"
              required
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: '6px' }}>original track</div>
            <input
              value={track}
              onChange={e => setTrack(e.target.value)}
              placeholder="MAD MAX"
              required
            />
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: '6px' }}>producer notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span></div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How you made it, what samples you used, how close you got, what you couldn't figure out..."
            style={{ minHeight: 100 }}
          />
        </div>

        <div>
          <div className="label" style={{ marginBottom: '6px' }}>audio file <span style={{ color: 'var(--text-muted)' }}>(MP3 or WAV, max 50MB)</span></div>
          <input
            type="file"
            accept="audio/mp3,audio/wav,audio/mpeg,audio/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            style={{ border: 'none', background: 'none', padding: '8px 0', color: 'var(--text-secondary)' }}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button className="btn btn-primary" type="submit" disabled={uploading}>
            {uploading ? 'uploading…' : 'post recreation'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}
