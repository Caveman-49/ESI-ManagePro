import pool from '../db.js';

const HOURS_PER_SESSION = 2; // Each timetable slot = 2h

/**
 * Recalculates module progress and remaining_hours based on
 * timetable_sessions that reference the module's name (subject)
 * and the module's class (class_id).
 *
 * Logic:
 *  - Count all timetable_sessions whose subject matches the module name
 *    AND whose class_id matches the module's class_id.
 *  - scheduled_hours = session_count × 2
 *  - progress = MIN(scheduled_hours / total_hours × 100, 100)   (if total_hours > 0)
 *  - remaining_hours = MAX(total_hours − scheduled_hours, 0)
 */
export async function recalcModuleProgress() {
  try {
    // Get all modules with their class info
    const { rows: modules } = await pool.query(`
      SELECT m.id, m.name, m.class_id, m.total_hours
      FROM modules m
      WHERE m.total_hours > 0
    `);

    for (const mod of modules) {
      // Count sessions matching this module's subject and class across all timetables
      const { rows: [{ count }] } = await pool.query(`
        SELECT COUNT(*) AS count
        FROM timetable_sessions ts
        WHERE ts.subject = $1
          AND ts.class_id = $2
      `, [mod.name, mod.class_id]);

      const sessionCount = parseInt(count) || 0;
      const scheduledHours = sessionCount * HOURS_PER_SESSION;
      const totalHours = Number(mod.total_hours) || 0;

      const progress = totalHours > 0
        ? Math.min(Math.round((scheduledHours / totalHours) * 100), 100)
        : 0;
      const remainingHours = Math.max(totalHours - scheduledHours, 0);
      const status = progress >= 100 ? 'Terminé' : 'En cours';

      await pool.query(
        `UPDATE modules SET progress = $1, remaining_hours = $2, status = $3 WHERE id = $4`,
        [progress, remainingHours, status, mod.id]
      );
    }

    console.log(`📊 Module progress recalculated for ${modules.length} module(s).`);

    // Also update class schedule_progress based on their modules' average progress
    await recalcClassProgress();
  } catch (err) {
    console.error('❌ Error recalculating module progress:', err.message);
  }
}

/**
 * Recalculates each class's schedule_progress as the average
 * progress of its modules.
 */
async function recalcClassProgress() {
  try {
    const { rows: classProgress } = await pool.query(`
      SELECT c.id AS class_id, COALESCE(ROUND(AVG(m.progress))::int, 0) AS avg_progress
      FROM classes c
      LEFT JOIN modules m ON m.class_id = c.id
      GROUP BY c.id
    `);

    for (const cp of classProgress) {
      await pool.query(
        `UPDATE classes SET schedule_progress = $1 WHERE id = $2`,
        [cp.avg_progress, cp.class_id]
      );
    }

    console.log(`📊 Class schedule_progress updated for ${classProgress.length} class(es).`);
  } catch (err) {
    console.error('❌ Error recalculating class progress:', err.message);
  }
}
