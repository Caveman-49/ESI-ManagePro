import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/timetables – returns all timetables with nested sessions and notes
router.get('/', async (req, res) => {
  try {
    const [timetables] = await pool.query('SELECT * FROM timetables ORDER BY created_at DESC');
    
    for (const tt of timetables) {
      // Build days array from start_date (Monday → Saturday)
      const FR_DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
      const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
      const base = new Date(tt.start_date + 'T12:00:00');
      tt.days = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]}`;
      });

      // Build schedules object: { className: { dayIdx: { slotIdx: session } } }
      const [sessions] = await pool.query(
        `SELECT ts.*, c.name AS class_name
         FROM timetable_sessions ts
         JOIN classes c ON ts.class_id = c.id
         WHERE ts.timetable_id = ?`,
        [tt.id]
      );
      const schedules = {};
      for (const s of sessions) {
        if (!schedules[s.class_name]) schedules[s.class_name] = {};
        if (!schedules[s.class_name][s.day_idx]) schedules[s.class_name][s.day_idx] = {};
        schedules[s.class_name][s.day_idx][s.slot_idx] = {
          subject: s.subject,
          type: s.type,
          teacher: s.teacher,
          room: s.room
        };
      }
      tt.schedules = schedules;

      // Build notes object: { className: noteText }
      const [notes] = await pool.query(
        `SELECT tn.note_text, c.name AS class_name
         FROM timetable_notes tn
         JOIN classes c ON tn.class_id = c.id
         WHERE tn.timetable_id = ?`,
        [tt.id]
      );
      tt.notes = {};
      for (const n of notes) {
        tt.notes[n.class_name] = n.note_text;
      }

      // Format dates for frontend compatibility
      tt.startDate = tt.start_date;
      tt.createdAt = new Date(tt.created_at).toLocaleDateString('fr-FR');
    }

    res.json(timetables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/timetables – create a full timetable with sessions and notes
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { period, start_date, schedules, notes, academic_year_id } = req.body;
    const id = 'TT-' + Date.now();

    // Insert timetable metadata
    await conn.query(
      'INSERT INTO timetables (id, period, start_date, academic_year_id) VALUES (?, ?, ?, ?)',
      [id, period, start_date, academic_year_id || null]
    );

    // Insert sessions
    if (schedules) {
      // Resolve class names → class IDs
      const [allClasses] = await conn.query('SELECT id, name FROM classes');
      const classMap = {};
      for (const c of allClasses) classMap[c.name] = c.id;

      for (const [className, days] of Object.entries(schedules)) {
        const classId = classMap[className];
        if (!classId) continue;
        for (const [dayIdx, slots] of Object.entries(days)) {
          for (const [slotIdx, session] of Object.entries(slots)) {
            if (!session || !session.subject) continue;
            await conn.query(
              `INSERT INTO timetable_sessions (timetable_id, class_id, day_idx, slot_idx, subject, type, teacher, room)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [id, classId, parseInt(dayIdx), parseInt(slotIdx), session.subject, session.type || 'Cours', session.teacher || '', session.room || '']
            );
          }
        }
      }

      // Insert notes
      if (notes) {
        for (const [className, noteText] of Object.entries(notes)) {
          if (!noteText) continue;
          const classId = classMap[className];
          if (!classId) continue;
          await conn.query(
            'INSERT INTO timetable_notes (timetable_id, class_id, note_text) VALUES (?, ?, ?)',
            [id, classId, noteText]
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ id, period, start_date });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
});

// PUT /api/timetables/:id – update sessions and notes
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { schedules, notes } = req.body;
    const ttId = req.params.id;

    // Resolve class names → class IDs
    const [allClasses] = await conn.query('SELECT id, name FROM classes');
    const classMap = {};
    for (const c of allClasses) classMap[c.name] = c.id;

    // Replace all sessions
    if (schedules) {
      await conn.query('DELETE FROM timetable_sessions WHERE timetable_id = ?', [ttId]);
      for (const [className, days] of Object.entries(schedules)) {
        const classId = classMap[className];
        if (!classId) continue;
        for (const [dayIdx, slots] of Object.entries(days)) {
          for (const [slotIdx, session] of Object.entries(slots)) {
            if (!session || !session.subject) continue;
            await conn.query(
              `INSERT INTO timetable_sessions (timetable_id, class_id, day_idx, slot_idx, subject, type, teacher, room)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [ttId, classId, parseInt(dayIdx), parseInt(slotIdx), session.subject, session.type || 'Cours', session.teacher || '', session.room || '']
            );
          }
        }
      }
    }

    // Replace all notes
    if (notes) {
      await conn.query('DELETE FROM timetable_notes WHERE timetable_id = ?', [ttId]);
      for (const [className, noteText] of Object.entries(notes)) {
        if (!noteText) continue;
        const classId = classMap[className];
        if (!classId) continue;
        await conn.query(
          'INSERT INTO timetable_notes (timetable_id, class_id, note_text) VALUES (?, ?, ?)',
          [ttId, classId, noteText]
        );
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/timetables/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM timetables WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
