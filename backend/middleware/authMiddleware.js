import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'esimanage-pro-dev-secret-change-in-production';

// Génère un token JWT pour un utilisateur
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware qui vérifie que le token JWT est valide
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise. Token manquant.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
      }
      return res.status(403).json({ error: 'Token invalide.' });
    }
    req.user = user;
    next();
  });
}

// Middleware qui vérifie le rôle de l'utilisateur
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}` });
    }
    next();
  };
}
