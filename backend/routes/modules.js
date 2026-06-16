import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/modules
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*,
             p.name AS teacher,
             c.name AS className,
             prereq.name AS prerequisite
      FROM modules m
      LEFT JOIN professors p ON m.teacher_id = p.id
      LEFT JOIN classes c ON m.class_id = c.id
      LEFT JOIN modules prereq ON m.prerequisite_id = prereq.id
      ORDER BY c.name, m.semester, m.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/modules
router.post('/', async (req, res) => {
  try {
    const { name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status } = req.body;
    const id = 'MOD-' + Date.now();
    await pool.query(
      `INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, teacher_id || null, class_id, semester, total_hours || 0, remaining_hours || 0, progress || 0, prerequisite_id || null, status || 'En cours']
    );
    const [rows] = await pool.query(`
      SELECT m.*, p.name AS teacher, c.name AS className, prereq.name AS prerequisite
      FROM modules m
      LEFT JOIN professors p ON m.teacher_id = p.id
      LEFT JOIN classes c ON m.class_id = c.id
      LEFT JOIN modules prereq ON m.prerequisite_id = prereq.id
      WHERE m.id = ?
    `, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/modules/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status } = req.body;
    await pool.query(
      `UPDATE modules SET name=?, teacher_id=?, class_id=?, semester=?, total_hours=?, remaining_hours=?, progress=?, prerequisite_id=?, status=?
       WHERE id=?`,
      [name, teacher_id || null, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id || null, status, req.params.id]
    );
    const [rows] = await pool.query(`
      SELECT m.*, p.name AS teacher, c.name AS className, prereq.name AS prerequisite
      FROM modules m
      LEFT JOIN professors p ON m.teacher_id = p.id
      LEFT JOIN classes c ON m.class_id = c.id
      LEFT JOIN modules prereq ON m.prerequisite_id = prereq.id
      WHERE m.id = ?
    `, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/modules/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM modules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
