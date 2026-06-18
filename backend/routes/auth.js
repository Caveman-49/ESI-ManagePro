import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import pool from '../db.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// ── Rate Limiting : max 5 tentatives de connexion par IP en 15 minutes ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Schéma de validation Zod pour le login ──
const loginSchema = z.object({
  email: z
    .string()
    .email('Email invalide.')
    .max(255, 'Email trop long.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres.')
    .max(128, 'Mot de passe trop long.'),
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const { rows } = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const user = rows[0];

    // Verification avec bcrypt (support SHA-256 legacy)
    let passwordValid = false;
    const hash = user.password_hash;

    if (hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')) {
      passwordValid = await bcrypt.compare(password, hash);
    } else {
      // Ancien hash SHA-256 (retrocompatibilite)
      const crypto = await import('crypto');
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      passwordValid = sha256 === hash;

      // Migration automatique vers bcrypt
      if (passwordValid) {
        const bcryptHash = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [bcryptHash, user.id]
        );
        console.log('Mot de passe migre vers bcrypt pour', user.email);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    // Generation du token JWT
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/auth/me — Verifie la session au rechargement
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token manquant.' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'esimanage-pro-dev-secret-change-in-production';
    const token = authHeader.split(' ')[1];
    const decoded = jwt.default.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expiree.' });
  }
});

export default router;
