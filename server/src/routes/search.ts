import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/search?q=jaykatana+MAD+MAX
// Searches recreations by original_artist and original_track
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();

  if (!q) {
    res.status(400).json({ error: 'Query required' });
    return;
  }

  try {
    const result = await pool.query(`
      SELECT r.*, u.username,
             ROUND(AVG(rt.fidelity)::numeric, 2) AS avg_fidelity,
             COUNT(rt.id) AS rating_count
      FROM recreations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.recreation_id = r.id
      WHERE
        r.original_artist ILIKE $1 OR
        r.original_track  ILIKE $1 OR
        r.title           ILIKE $1 OR
        (r.original_artist || ' ' || r.original_track) ILIKE $1
      GROUP BY r.id, u.username
      ORDER BY r.bumped_at DESC NULLS LAST, r.created_at DESC
    `, [`%${q}%`]);

    // Also return distinct matched artists so the frontend knows
    // whether there are ANY recreations for a given artist name
    const artistCheck = await pool.query(`
      SELECT DISTINCT original_artist
      FROM recreations
      WHERE original_artist ILIKE $1
      ORDER BY original_artist
    `, [`%${q}%`]);

    res.json({
      recreations: result.rows,
      matchedArtists: artistCheck.rows.map((r: { original_artist: string }) => r.original_artist),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
