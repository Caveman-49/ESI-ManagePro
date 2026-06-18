import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/rooms
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const id = 'RM-' + Date.now();
    await pool.query('INSERT INTO rooms (id, name, type) VALUES ($1, $2, $3)', [id, name, type]);
    res.status(201).json({ id, name, type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/rooms/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, type } = req.body;
    await pool.query('UPDATE rooms SET name=$1, type=$2 WHERE id=$3', [name, type, req.params.id]);
    res.json({ id: req.params.id, name, type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
