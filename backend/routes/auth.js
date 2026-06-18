import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // 1. PostgreSQL utilise $1, $2 au lieu de ?
    // 2. pool.query renvoie un objet avec la propriété .rows
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = $1 AND password_hash = $2',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;