import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/evaluations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*,
             m.name AS moduleName,
             c.name AS classGroup,
             r.name AS room
      FROM evaluations e
      LEFT JOIN modules m ON e.module_id = m.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN rooms r ON e.room_id = r.id
      ORDER BY e.eval_date DESC, e.eval_time
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/evaluations
router.post('/', async (req, res) => {
  try {
    const { module_id, type, eval_date, eval_time, class_id, room_id, academic_year_id, weight, status } = req.body;
    const id = 'EV-' + Date.now();
    await pool.query(
      `INSERT INTO evaluations (id, module_id, type, eval_date, eval_time, class_id, room_id, academic_year_id, weight, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, module_id, type, eval_date, eval_time, class_id, room_id || null, academic_year_id || null, weight, status || 'Planifié']
    );
    const [rows] = await pool.query(`
      SELECT e.*, m.name AS moduleName, c.name AS classGroup, r.name AS room
      FROM evaluations e
      LEFT JOIN modules m ON e.module_id = m.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE e.id = ?
    `, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/evaluations/:id
router.put('/:id', async (req, res) => {
  try {
    const { module_id, type, eval_date, eval_time, class_id, room_id, academic_year_id, weight, status } = req.body;
    await pool.query(
      `UPDATE evaluations SET module_id=?, type=?, eval_date=?, eval_time=?, class_id=?, room_id=?, academic_year_id=?, weight=?, status=?
       WHERE id=?`,
      [module_id, type, eval_date, eval_time, class_id, room_id || null, academic_year_id || null, weight, status, req.params.id]
    );
    const [rows] = await pool.query(`
      SELECT e.*, m.name AS moduleName, c.name AS classGroup, r.name AS room
      FROM evaluations e
      LEFT JOIN modules m ON e.module_id = m.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE e.id = ?
    `, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/evaluations/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM evaluations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
