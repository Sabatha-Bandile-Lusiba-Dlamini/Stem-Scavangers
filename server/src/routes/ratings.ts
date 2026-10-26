import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/ratings — rate a recreation (upsert)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { recreation_id, fidelity } = req.body;

  if (!recreation_id || !fidelity || fidelity < 1 || fidelity > 5) {
    res.status(400).json({ error: 'recreation_id and fidelity (1–5) required' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO ratings (user_id, recreation_id, fidelity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, recreation_id)
       DO UPDATE SET fidelity = EXCLUDED.fidelity
       RETURNING *`,
      [req.user!.id, recreation_id, fidelity]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ratings/my/:recreation_id — get the current user's rating for a recreation
router.get('/my/:recreation_id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND recreation_id = $2',
      [req.user!.id, req.params.recreation_id]
    );
    res.json(result.rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
