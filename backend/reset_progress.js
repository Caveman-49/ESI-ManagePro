import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { rowCount } = await pool.query(
  `UPDATE modules SET progress = 0, remaining_hours = total_hours, status = 'En cours'`
);
console.log(`✅ ${rowCount} module(s) remis à zéro (progress=0, remaining_hours=total_hours, status='En cours').`);
await pool.end();
