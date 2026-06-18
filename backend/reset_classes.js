import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Reset student_count and representative for all classes
const { rowCount } = await pool.query(
  `UPDATE classes SET student_count = 0, representative = ''`
);
console.log(`✅ ${rowCount} class(es) updated (student_count=0, representative='').`);

await pool.end();
