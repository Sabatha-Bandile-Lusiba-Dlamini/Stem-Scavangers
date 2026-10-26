import { Router, Response } from 'express';
import multer from 'multer';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadAudio, deleteAudio } from '../services/supabase';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/recreations — community feed (all, recent first)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.username,
             ROUND(AVG(rt.fidelity)::numeric, 2) AS avg_fidelity,
             COUNT(rt.id) AS rating_count
      FROM recreations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.recreation_id = r.id
      GROUP BY r.id, u.username
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recreations/top — Bayesian weighted top recreations
router.get('/top', async (_req, res: Response) => {
  try {
    const result = await pool.query(`
      WITH global AS (
        SELECT AVG(fidelity) AS global_avg,
               COUNT(*) AS total_ratings
        FROM ratings
      ),
      rec_stats AS (
        SELECT r.id, r.title, r.original_artist, r.original_track,
               r.audio_url, r.producer_notes, r.created_at, r.user_id,
               u.username,
               COALESCE(AVG(rt.fidelity), 0) AS avg_fidelity,
               COUNT(rt.id) AS rating_count
        FROM recreations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN ratings rt ON rt.recreation_id = r.id
        GROUP BY r.id, u.username
      )
      SELECT rs.*,
             ROUND(
               (rs.rating_count::numeric / (rs.rating_count + 5) * rs.avg_fidelity +
               5.0 / (rs.rating_count + 5) * g.global_avg)::numeric, 3
             ) AS weighted_score
      FROM rec_stats rs, global g
      ORDER BY weighted_score DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recreations/artist/:name — all recreations of a specific original artist
router.get('/artist/:name', async (req, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.username,
             ROUND(AVG(rt.fidelity)::numeric, 2) AS avg_fidelity,
             COUNT(rt.id) AS rating_count
      FROM recreations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.recreation_id = r.id
      WHERE LOWER(r.original_artist) = LOWER($1)
      GROUP BY r.id, u.username
      ORDER BY avg_fidelity DESC NULLS LAST, r.created_at DESC
    `, [req.params.name]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recreations/user/:username — all recreations by a user
router.get('/user/:username', async (req, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.username,
             ROUND(AVG(rt.fidelity)::numeric, 2) AS avg_fidelity,
             COUNT(rt.id) AS rating_count
      FROM recreations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.recreation_id = r.id
      WHERE u.username = $1
      GROUP BY r.id, u.username
      ORDER BY r.created_at DESC
    `, [req.params.username]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recreations/:id — single recreation with stems
router.get('/:id', async (req, res: Response) => {
  try {
    const recResult = await pool.query(`
      SELECT r.*, u.username,
             ROUND(AVG(rt.fidelity)::numeric, 2) AS avg_fidelity,
             COUNT(rt.id) AS rating_count
      FROM recreations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.recreation_id = r.id
      WHERE r.id = $1
      GROUP BY r.id, u.username
    `, [req.params.id]);

    if (!recResult.rows[0]) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const stemsResult = await pool.query(
      'SELECT * FROM stems WHERE recreation_id = $1 ORDER BY order_index ASC',
      [req.params.id]
    );

    res.json({ ...recResult.rows[0], stems: stemsResult.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recreations — create recreation with audio upload
router.post('/', requireAuth, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  const { title, original_artist, original_track, producer_notes } = req.body;

  if (!req.file) {
    res.status(400).json({ error: 'Audio file required' });
    return;
  }
  if (!title || !original_artist || !original_track) {
    res.status(400).json({ error: 'title, original_artist, and original_track are required' });
    return;
  }

  try {
    const audioUrl = await uploadAudio(req.file, 'beats');

    const result = await pool.query(
      `INSERT INTO recreations (user_id, title, original_artist, original_track, audio_url, producer_notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user!.id, title, original_artist, original_track, audioUrl, producer_notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// DELETE /api/recreations/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recreations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!result.rows[0]) {
      res.status(403).json({ error: 'Not your recreation' });
      return;
    }

    await deleteAudio(result.rows[0].audio_url);
    await pool.query('DELETE FROM recreations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
