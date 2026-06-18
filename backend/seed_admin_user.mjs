import pool from './db.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function run() {
  try {
    const hashedPassword = hashPassword('@EsimanagerL2G16');

    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = $2, password_hash = $4, role = $5
       RETURNING id, name, email, role`,
      ['USR-02', 'Directeur Adjoint', 'esi@manager26.dz', hashedPassword, 'Admin']
    );

    console.log('✅ Utilisateur ajouté avec succès :');
    console.log(JSON.stringify(rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de l\'ajout de l\'utilisateur :', err);
    process.exit(1);
  }
}

run();
