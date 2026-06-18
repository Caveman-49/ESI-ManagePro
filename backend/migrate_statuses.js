import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// 1. Reset module progress to zero
const { rowCount: modCount } = await pool.query(
  `UPDATE modules SET progress = 0, remaining_hours = total_hours, status = 'En cours'`
);
console.log(`✅ ${modCount} module(s) remis à zéro (progress=0, remaining_hours=total_hours, status='En cours').`);

// 2. Migrate evaluation statuses: "En cours" → "Planifié", "Annulé" → "Planifié"
const { rowCount: evalCount } = await pool.query(
  `UPDATE evaluations SET status = 'Planifié' WHERE status IN ('En cours', 'Annulé')`
);
console.log(`✅ ${evalCount} évaluation(s) migrée(s) vers 'Planifié'.`);

// 3. Update all evaluations type to 'Evaluation' (remove old types)
const { rowCount: evalTypeCount } = await pool.query(
  `UPDATE evaluations SET type = 'Evaluation' WHERE type != 'Evaluation'`
);
console.log(`✅ ${evalTypeCount} évaluation(s) dont le type a été normalisé à 'Evaluation'.`);

await pool.end();
