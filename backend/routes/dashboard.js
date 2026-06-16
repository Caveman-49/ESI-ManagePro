import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/dashboard/stats – summary statistics for the dashboard
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalClasses }]] = await pool.query('SELECT COUNT(*) AS totalClasses FROM classes');
    const [[{ totalProfessors }]] = await pool.query('SELECT COUNT(*) AS totalProfessors FROM professors');
    const [[{ totalModules }]] = await pool.query('SELECT COUNT(*) AS totalModules FROM modules');
    const [[{ totalStudents }]] = await pool.query('SELECT COALESCE(SUM(student_count), 0) AS totalStudents FROM classes');
    const [[{ totalRooms }]] = await pool.query('SELECT COUNT(*) AS totalRooms FROM rooms');
    const [[{ upcomingEvals }]] = await pool.query("SELECT COUNT(*) AS upcomingEvals FROM evaluations WHERE status = 'Planifié'");

    res.json({
      totalClasses,
      totalProfessors,
      totalModules,
      totalStudents,
      totalRooms,
      upcomingEvals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/today-schedule – today's schedule for the dashboard
router.get('/today-schedule', async (req, res) => {
  try {
    // Get sessions for today from all timetables
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayIdx = dayOfWeek === 0 ? -1 : dayOfWeek - 1; // Convert to 0=Mon...5=Sat, -1=Sun (no classes)

    if (dayIdx < 0 || dayIdx > 5) {
      return res.json([]);
    }

    const PDF_SLOTS = ['8h-10h', '10h-12h', '14h-16h', '16h-18h'];
    const SLOT_TIMES = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'];

    // Find the Monday of this week
    const monday = new Date(today);
    monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayStr = monday.toISOString().split('T')[0];

    const [sessions] = await pool.query(`
      SELECT ts.*, c.name AS class_name, t.start_date
      FROM timetable_sessions ts
      JOIN classes c ON ts.class_id = c.id
      JOIN timetables t ON ts.timetable_id = t.id
      WHERE t.start_date = ? AND ts.day_idx = ?
      ORDER BY ts.slot_idx
    `, [mondayStr, dayIdx]);

    const result = sessions.map(s => ({
      id: 'SCH-' + s.id,
      time: SLOT_TIMES[s.slot_idx] || PDF_SLOTS[s.slot_idx],
      subject: s.subject,
      classGroup: s.class_name,
      room: s.room || '',
      professor: s.teacher || '',
      type: s.type,
      color: s.type === 'Cours' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' :
             s.type === 'TD' ? 'border-teal-500 text-teal-400 bg-teal-500/5' :
             s.type === 'TP' ? 'border-violet-500 text-violet-400 bg-violet-500/5' :
             'border-rose-500 text-rose-400 bg-rose-500/5'
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/class-performance – average performance per class
router.get('/class-performance', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.name,
             ROUND(AVG(m.progress), 1) AS average
      FROM classes c
      LEFT JOIN modules m ON m.class_id = c.id
      WHERE m.id IS NOT NULL
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
