import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const { rows: r1 } = await pool.query('SELECT COUNT(*) AS "totalClasses" FROM classes');
    const { rows: r2 } = await pool.query('SELECT COUNT(*) AS "totalProfessors" FROM professors');
    const { rows: r3 } = await pool.query('SELECT COUNT(*) AS "totalModules" FROM modules');
    const { rows: r4 } = await pool.query('SELECT COALESCE(SUM(student_count), 0) AS "totalStudents" FROM classes');
    const { rows: r5 } = await pool.query('SELECT COUNT(*) AS "totalRooms" FROM rooms');
    const { rows: r6 } = await pool.query("SELECT COUNT(*) AS \"upcomingEvals\" FROM evaluations WHERE status = 'Planifié'");

    res.json({
      totalClasses:    parseInt(r1[0].totalClasses),
      totalProfessors: parseInt(r2[0].totalProfessors),
      totalModules:    parseInt(r3[0].totalModules),
      totalStudents:   parseInt(r4[0].totalStudents),
      totalRooms:      parseInt(r5[0].totalRooms),
      upcomingEvals:   parseInt(r6[0].upcomingEvals),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/today-schedule
router.get('/today-schedule', async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayIdx = dayOfWeek === 0 ? -1 : dayOfWeek - 1; // 0=Mon...5=Sat, -1=Sun

    if (dayIdx < 0 || dayIdx > 5) {
      return res.json([]);
    }

    const SLOT_TIMES = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'];

    const monday = new Date(today);
    monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayStr = monday.toISOString().split('T')[0];

    const { rows: sessions } = await pool.query(`
      SELECT ts.*, c.name AS class_name, t.start_date
      FROM timetable_sessions ts
      JOIN classes c ON ts.class_id = c.id
      JOIN timetables t ON ts.timetable_id = t.id
      WHERE t.start_date = $1 AND ts.day_idx = $2
      ORDER BY ts.slot_idx
    `, [mondayStr, dayIdx]);

    const result = sessions.map(s => ({
      id: 'SCH-' + s.id,
      time: SLOT_TIMES[s.slot_idx] || '',
      subject: s.subject,
      classGroup: s.class_name,
      room: s.room || '',
      professor: s.teacher || '',
      type: s.type,
      color: s.type === 'Cours'  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' :
             s.type === 'TD'     ? 'border-teal-500 text-teal-400 bg-teal-500/5' :
             s.type === 'TP'     ? 'border-violet-500 text-violet-400 bg-violet-500/5' :
                                   'border-rose-500 text-rose-400 bg-rose-500/5'
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/eval-stats – répartition des évaluations par statut
router.get('/eval-stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM evaluations
      GROUP BY status
      ORDER BY status
    `);

    // Construction d'un objet normalisé
    const statsMap = { 'Planifié': 0, 'Effectué': 0, 'En cours': 0 };
    for (const r of rows) {
      statsMap[r.status] = parseInt(r.count);
    }
    const total = Object.values(statsMap).reduce((a, b) => a + b, 0);
    const effectue = statsMap['Effectué'] || 0;
    const planifie = statsMap['Planifié'] || 0;
    const enCours  = statsMap['En cours']  || 0;
    const tauxRealisation = total > 0 ? Math.round((effectue / total) * 100) : 0;

    res.json({
      total,
      effectue,
      planifie,
      enCours,
      tauxRealisation,
      // Format pour le graphique Recharts
      chart: [
        { name: 'Effectué',  value: effectue, color: '#10b981' },
        { name: 'Planifié',  value: planifie, color: '#6366f1' },
        { name: 'En cours',  value: enCours,  color: '#f59e0b' },
      ].filter(d => d.value > 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/class-performance
router.get('/class-performance', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.name,
             ROUND(AVG(m.progress)::numeric, 1) AS average
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
