import pool from '../db.js';

/**
 * Passe automatiquement les évaluations dont la date est passée
 * (eval_date < aujourd'hui) de 'Planifié' à 'Effectué'.
 * Lancé au démarrage puis toutes les heures.
 */
export async function runEvalAutoUpdate() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { rowCount } = await pool.query(
      `UPDATE evaluations
         SET status = 'Effectué'
       WHERE status = 'Planifié'
         AND eval_date < $1`,
      [today]
    );
    if (rowCount > 0) {
      console.log(`🔄 Auto-update évaluations : ${rowCount} évaluation(s) passée(s) à 'Effectué'.`);
    }
  } catch (err) {
    console.error('❌ Erreur auto-update évaluations:', err.message);
  }
}

/**
 * Démarre le job périodique (toutes les heures).
 */
export function startEvalAutoUpdateJob() {
  // Exécution immédiate au démarrage
  runEvalAutoUpdate();
  // Puis toutes les heures (3 600 000 ms)
  setInterval(runEvalAutoUpdate, 60 * 60 * 1000);
  console.log('⏱  Job auto-update évaluations démarré (intervalle : 1h).');
}
