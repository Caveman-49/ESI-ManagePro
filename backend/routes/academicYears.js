import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/academic-years
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM academic_years ORDER BY label DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/academic-years
router.post('/', async (req, res) => {
  try {
    const { id, label, is_current } = req.body;
    await pool.query(
      'INSERT INTO academic_years (id, label, is_current) VALUES ($1, $2, $3)',
      [id, label, is_current || false]
    );
    res.status(201).json({ id, label, is_current: is_current || false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/academic-years/:id
router.put('/:id', async (req, res) => {
  try {
    const { label, is_current } = req.body;
    await pool.query(
      'UPDATE academic_years SET label = $1, is_current = $2 WHERE id = $3',
      [label, is_current, req.params.id]
    );
    res.json({ id: req.params.id, label, is_current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
