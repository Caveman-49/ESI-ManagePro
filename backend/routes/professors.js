import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/professors
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM professors ORDER BY name');
    for (const prof of rows) {
      const { rows: mods } = await pool.query('SELECT name FROM modules WHERE teacher_id = $1', [prof.id]);
      prof.activeModules = mods.map(m => m.name);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/professors
router.post('/', async (req, res) => {
  try {
    const { name, department, email, availability, avatar_bg } = req.body;
    const id = 'PRF-' + Date.now();
    await pool.query(
      'INSERT INTO professors (id, name, department, email, availability, avatar_bg) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, department, email, availability || 'Disponible', avatar_bg || 'bg-indigo-600']
    );
    const { rows } = await pool.query('SELECT * FROM professors WHERE id = $1', [id]);
    rows[0].activeModules = [];
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Cet email existe déjà.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/professors/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, department, email, availability, avatar_bg } = req.body;
    await pool.query(
      'UPDATE professors SET name=$1, department=$2, email=$3, availability=$4, avatar_bg=$5 WHERE id=$6',
      [name, department, email, availability, avatar_bg, req.params.id]
    );
    const { rows } = await pool.query('SELECT * FROM professors WHERE id = $1', [req.params.id]);
    const { rows: mods } = await pool.query('SELECT name FROM modules WHERE teacher_id = $1', [req.params.id]);
    rows[0].activeModules = mods.map(m => m.name);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/professors/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM professors WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
