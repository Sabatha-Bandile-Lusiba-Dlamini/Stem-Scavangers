import { Router, Response } from 'express';
import multer from 'multer';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadAudio, deleteAudio } from '../services/supabase';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

// POST /api/stems — add a stem to a recreation
router.post('/', requireAuth, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  const { recreation_id, name, description, order_index } = req.body;

  if (!req.file) {
    res.status(400).json({ error: 'Audio file required' });
    return;
  }
  if (!recreation_id || !name) {
    res.status(400).json({ error: 'recreation_id and name required' });
    return;
  }

  try {
    // Make sure this recreation belongs to the requesting user
    const ownership = await pool.query(
      'SELECT id FROM recreations WHERE id = $1 AND user_id = $2',
      [recreation_id, req.user!.id]
    );
    if (!ownership.rows[0]) {
      res.status(403).json({ error: 'Not your recreation' });
      return;
    }

    const audioUrl = await uploadAudio(req.file, 'stems');

    const result = await pool.query(
      `INSERT INTO stems (recreation_id, name, audio_url, description, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [recreation_id, name, audioUrl, description || null, order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PATCH /api/stems/:id — update name or description
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, description, order_index } = req.body;

  try {
    // Verify ownership via join
    const check = await pool.query(
      `SELECT s.id FROM stems s
       JOIN recreations r ON s.recreation_id = r.id
       WHERE s.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (!check.rows[0]) {
      res.status(403).json({ error: 'Not your stem' });
      return;
    }

    const result = await pool.query(
      `UPDATE stems
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           order_index = COALESCE($3, order_index)
       WHERE id = $4
       RETURNING *`,
      [name || null, description || null, order_index ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/stems/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.*, r.user_id FROM stems s
       JOIN recreations r ON s.recreation_id = r.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (result.rows[0].user_id !== req.user!.id) {
      res.status(403).json({ error: 'Not your stem' });
      return;
    }

    await deleteAudio(result.rows[0].audio_url);
    await pool.query('DELETE FROM stems WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
