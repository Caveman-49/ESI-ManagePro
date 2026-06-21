import { Router } from 'express';
import pool from '../db.js';

const router = Router();

async function updateModuleHours(client, classId, subject, deltaHours) {
  const { rows } = await client.query('SELECT id, total_hours, remaining_hours FROM modules WHERE class_id = $1 AND name = $2', [classId, subject]);
  if (rows.length === 0) return;
  const mod = rows[0];
  const total = Number(mod.total_hours) || 0;
  let remaining = Number(mod.remaining_hours) || 0;
  
  remaining = remaining + deltaHours;
  if (remaining < 0) remaining = 0;
  if (remaining > total) remaining = total;
  
  const completed = Math.max(0, total - remaining);
  const progress = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
  const status = progress >= 100 ? 'Terminé' : 'En cours';
  
  await client.query(
    'UPDATE modules SET remaining_hours = $1, progress = $2, status = $3 WHERE id = $4',
    [remaining, progress, status, mod.id]
  );
}

// GET /api/timetables – retourne tous les emplois du temps avec sessions et notes imbriquées
router.get('/', async (req, res) => {
  try {
    // PostgreSQL : Utilisation de la déstructuration { rows } au lieu de [rows]
    const { rows: timetables } = await pool.query('SELECT * FROM timetables ORDER BY created_at DESC');
    
    for (const tt of timetables) {
      // Construction du tableau de jours à partir de start_date (Lundi → Samedi)
      const FR_DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
      const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
      
      const base = typeof tt.start_date === 'string' ? new Date(tt.start_date + 'T12:00:00') : new Date(tt.start_date);
      base.setHours(12, 0, 0, 0);

      tt.days = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]}`;
      });

      // Schedules object: { className: { dayIdx: { slotIdx: session } } }
      // Remplacement de ? par $1
      const { rows: sessions } = await pool.query(
        `SELECT ts.*, c.name AS class_name
         FROM timetable_sessions ts
         JOIN classes c ON ts.class_id = c.id
         WHERE ts.timetable_id = $1`,
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
          room: s.room,
          is_forced: s.is_forced // Ajout du flag pour le suivi
        };
      }
      tt.schedules = schedules;

      // Notes object: { className: noteText }
      const { rows: notes } = await pool.query(
        `SELECT tn.note_text, c.name AS class_name
         FROM timetable_notes tn
         JOIN classes c ON tn.class_id = c.id
         WHERE tn.timetable_id = $1`,
        [tt.id]
      );
      tt.notes = {};
      for (const n of notes) {
        tt.notes[n.class_name] = n.note_text;
      }

      // Formatage des dates pour la compatibilité frontend
      tt.startDate = base.toISOString().split('T')[0];
      tt.createdAt = new Date(tt.created_at).toLocaleDateString('fr-FR');
    }

    res.json(timetables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/timetables – crée un emploi du temps complet avec ses sessions et ses notes
router.post('/', async (req, res) => {
  // Gestion du client de connexion PostgreSQL pour la transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { period, start_date, schedules, notes, academic_year_id } = req.body;
    const id = 'TT-' + Date.now();

    // Insertion des métadonnées
    await client.query(
      'INSERT INTO timetables (id, period, start_date, academic_year_id) VALUES ($1, $2, $3, $4)',
      [id, period, start_date, academic_year_id || null]
    );

    if (schedules) {
      // Résolution des noms de classes → IDs de classes
      const { rows: allClasses } = await client.query('SELECT id, name FROM classes');
      const classMap = {};
      for (const c of allClasses) classMap[c.name] = c.id;

      for (const [className, days] of Object.entries(schedules)) {
        const classId = classMap[className];
        if (!classId) continue;
        for (const [dayIdx, slots] of Object.entries(days)) {
          for (const [slotIdx, session] of Object.entries(slots)) {
            if (!session || !session.subject) continue;
            
            // On récupère is_forced s'il est envoyé par le frontend (cas forcé)
            const isForced = session.is_forced || false;

            await client.query(
              `INSERT INTO timetable_sessions (timetable_id, class_id, day_idx, slot_idx, subject, type, teacher, room, is_forced)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [id, classId, parseInt(dayIdx), parseInt(slotIdx), session.subject, session.type || 'Cours', session.teacher || '', session.room || '', isForced]
            );
            await updateModuleHours(client, classId, session.subject, -2);
          }
        }
      }

      // Insertion des notes
      if (notes) {
        for (const [className, noteText] of Object.entries(notes)) {
          if (!noteText) continue;
          const classId = classMap[className];
          if (!classId) continue;
          await client.query(
            'INSERT INTO timetable_notes (timetable_id, class_id, note_text) VALUES ($1, $2, $3)',
            [id, classId, noteText]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id, period, start_date });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);

    // Interception de l'erreur levée par le Trigger PostgreSQL (PREREQ_NOT_MET)
    if (err.message && err.message.includes('PREREQ_NOT_MET')) {
      return res.status(409).json({ 
        error: 'PREREQ_NOT_MET', 
        message: err.message 
      });
    }

    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// PUT /api/timetables/:id – met à jour les sessions et les notes
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { schedules, notes } = req.body;
    const ttId = req.params.id;

    // Résolution des noms de classes → IDs de classes
    const { rows: allClasses } = await client.query('SELECT id, name FROM classes');
    const classMap = {};
    for (const c of allClasses) classMap[c.name] = c.id;

    // Remplacement de toutes les sessions
    if (schedules) {
      const { rows: oldSessions } = await client.query('SELECT class_id, subject FROM timetable_sessions WHERE timetable_id = $1', [ttId]);
      for (const oldS of oldSessions) {
        await updateModuleHours(client, oldS.class_id, oldS.subject, 2);
      }
      await client.query('DELETE FROM timetable_sessions WHERE timetable_id = $1', [ttId]);
      for (const [className, days] of Object.entries(schedules)) {
        const classId = classMap[className];
        if (!classId) continue;
        for (const [dayIdx, slots] of Object.entries(days)) {
          for (const [slotIdx, session] of Object.entries(slots)) {
            if (!session || !session.subject) continue;
            
            const isForced = session.is_forced || false;

            await client.query(
              `INSERT INTO timetable_sessions (timetable_id, class_id, day_idx, slot_idx, subject, type, teacher, room, is_forced)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [ttId, classId, parseInt(dayIdx), parseInt(slotIdx), session.subject, session.type || 'Cours', session.teacher || '', session.room || '', isForced]
            );
            await updateModuleHours(client, classId, session.subject, -2);
          }
        }
      }
    }

    // Remplacement de toutes les notes
    if (notes) {
      await client.query('DELETE FROM timetable_notes WHERE timetable_id = $1', [ttId]);
      for (const [className, noteText] of Object.entries(notes)) {
        if (!noteText) continue;
        const classId = classMap[className];
        if (!classId) continue;
        await client.query(
          'INSERT INTO timetable_notes (timetable_id, class_id, note_text) VALUES ($1, $2, $3)',
          [ttId, classId, noteText]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);

    // Même interception de l'erreur en cas de modification
    if (err.message && err.message.includes('PREREQ_NOT_MET')) {
      return res.status(409).json({ 
        error: 'PREREQ_NOT_MET', 
        message: err.message 
      });
    }

    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// DELETE /api/timetables/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: oldSessions } = await client.query('SELECT class_id, subject FROM timetable_sessions WHERE timetable_id = $1', [req.params.id]);
    for (const oldS of oldSessions) {
      await updateModuleHours(client, oldS.class_id, oldS.subject, 2);
    }
    await client.query('DELETE FROM timetables WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

export default router;