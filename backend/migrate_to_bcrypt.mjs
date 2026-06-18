import pool from './db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function run() {
  try {
    // 1. Migrer le mot de passe de l'admin existant (admin123)
    const adminHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND (password_hash = $3 OR password_hash NOT LIKE $4)',
      [adminHash, 'USR-01', crypto.createHash('sha256').update('admin123').digest('hex'), '$2b$%']
    );
    console.log('Admin password migrated');

    // 2. Verifier les mots de passe
    const { rows } = await pool.query('SELECT id, email, role, password_hash FROM users ORDER BY id');
    for (const user of rows) {
      const isBcrypt = user.password_hash.startsWith('$2');
      console.log(user.id + ' - ' + user.email + ' - ' + (isBcrypt ? 'bcrypt' : 'SHA-256 (legacy)'));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
