import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/evaluations
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, module_id, type, eval_date, eval_time, class_id, room_id || null, academic_year_id || null, weight, status || 'Planifié']
    );
    const { rows } = await pool.query(`
      SELECT e.*, m.name AS moduleName, c.name AS classGroup, r.name AS room
      FROM evaluations e
      LEFT JOIN modules m ON e.module_id = m.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE e.id = $1
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
      `UPDATE evaluations SET module_id=$1, type=$2, eval_date=$3, eval_time=$4, class_id=$5, room_id=$6, academic_year_id=$7, weight=$8, status=$9
       WHERE id=$10`,
      [module_id, type, eval_date, eval_time, class_id, room_id || null, academic_year_id || null, weight, status, req.params.id]
    );
    const { rows } = await pool.query(`
      SELECT e.*, m.name AS moduleName, c.name AS classGroup, r.name AS room
      FROM evaluations e
      LEFT JOIN modules m ON e.module_id = m.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE e.id = $1
    `, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PATCH /api/evaluations/:id/status – mise à jour du statut uniquement
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Planifié', 'En cours', 'Effectué', 'Annulé'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${allowed.join(', ')}` });
    }
    await pool.query('UPDATE evaluations SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/evaluations/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM evaluations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
