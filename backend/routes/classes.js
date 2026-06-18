import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/classes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, p.name AS headTeacher
      FROM classes c
      LEFT JOIN professors p ON c.head_teacher_id = p.id
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/classes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, p.name AS headTeacher
      FROM classes c
      LEFT JOIN professors p ON c.head_teacher_id = p.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Classe non trouvée.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/classes
router.post('/', async (req, res) => {
  try {
    const { id, name, specialty, level, student_count, head_teacher_id, representative, schedule_progress } = req.body;
    const classId = id || 'CLS-' + Date.now();
    await pool.query(
      `INSERT INTO classes (id, name, specialty, level, student_count, head_teacher_id, representative, schedule_progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [classId, name, specialty || '', level || 'Licence', student_count || 0, head_teacher_id || null, representative || '', schedule_progress || 0]
    );
    const { rows } = await pool.query(
      'SELECT c.*, p.name AS headTeacher FROM classes c LEFT JOIN professors p ON c.head_teacher_id = p.id WHERE c.id = $1',
      [classId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/classes/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, specialty, level, student_count, head_teacher_id, representative, schedule_progress } = req.body;
    await pool.query(
      `UPDATE classes SET name=$1, specialty=$2, level=$3, student_count=$4, head_teacher_id=$5, representative=$6, schedule_progress=$7
       WHERE id=$8`,
      [name, specialty, level, student_count, head_teacher_id || null, representative, schedule_progress, req.params.id]
    );
    const { rows } = await pool.query(
      'SELECT c.*, p.name AS headTeacher FROM classes c LEFT JOIN professors p ON c.head_teacher_id = p.id WHERE c.id = $1',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/classes/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
