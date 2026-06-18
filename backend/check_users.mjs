import pool from './db.js';
const r = await pool.query('SELECT id, email, role, password_hash FROM users');
console.log(JSON.stringify(r.rows, null, 2));
process.exit(0);
