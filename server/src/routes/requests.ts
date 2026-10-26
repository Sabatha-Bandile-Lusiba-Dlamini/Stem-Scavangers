import { Router, Request, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/requests — ranked list by vote count
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ar.id,
        ar.artist_name,
        ar.created_at,
        u.username AS submitted_by,
        COUNT(arv.id) AS votes
      FROM artist_requests ar
      LEFT JOIN users u ON ar.submitted_by = u.id
      LEFT JOIN artist_request_votes arv ON arv.request_id = ar.id
      GROUP BY ar.id, u.username
      ORDER BY votes DESC, ar.created_at ASC
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/requests — submit a new artist request
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { artist_name } = req.body;

  if (!artist_name?.trim()) {
    res.status(400).json({ error: 'artist_name required' });
    return;
  }

  const name = artist_name.trim();

  try {
    // Check for existing request (case-insensitive)
    const existing = await pool.query(
      'SELECT id FROM artist_requests WHERE LOWER(artist_name) = LOWER($1)',
      [name]
    );

    if (existing.rows[0]) {
      // Already exists — just vote for it instead
      const requestId = existing.rows[0].id;
      await pool.query(
        `INSERT INTO artist_request_votes (request_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (request_id, user_id) DO NOTHING`,
        [requestId, req.user!.id]
      );
      const updated = await pool.query(`
        SELECT ar.id, ar.artist_name, ar.created_at,
               u.username AS submitted_by,
               COUNT(arv.id) AS votes
        FROM artist_requests ar
        LEFT JOIN users u ON ar.submitted_by = u.id
        LEFT JOIN artist_request_votes arv ON arv.request_id = ar.id
        WHERE ar.id = $1
        GROUP BY ar.id, u.username
      `, [requestId]);
      res.status(200).json({ merged: true, request: updated.rows[0] });
      return;
    }

    // New request + auto-vote by submitter
    const newReq = await pool.query(
      `INSERT INTO artist_requests (artist_name, submitted_by)
       VALUES ($1, $2) RETURNING *`,
      [name, req.user!.id]
    );
    await pool.query(
      `INSERT INTO artist_request_votes (request_id, user_id) VALUES ($1, $2)`,
      [newReq.rows[0].id, req.user!.id]
    );

    res.status(201).json({ merged: false, request: newReq.rows[0] });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/requests/:id/vote — vote for an existing request
router.post('/:id/vote', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      `INSERT INTO artist_request_votes (request_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (request_id, user_id) DO NOTHING`,
      [req.params.id, req.user!.id]
    );

    const result = await pool.query(
      'SELECT COUNT(*) AS votes FROM artist_request_votes WHERE request_id = $1',
      [req.params.id]
    );
    res.json({ votes: result.rows[0].votes });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/requests/:id/vote — unvote
router.delete('/:id/vote', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM artist_request_votes WHERE request_id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    const result = await pool.query(
      'SELECT COUNT(*) AS votes FROM artist_request_votes WHERE request_id = $1',
      [req.params.id]
    );
    res.json({ votes: result.rows[0].votes });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/requests/myvotes — which request IDs the current user has voted for
router.get('/myvotes', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT request_id FROM artist_request_votes WHERE user_id = $1',
      [req.user!.id]
    );
    res.json(result.rows.map((r: { request_id: number }) => r.request_id));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
