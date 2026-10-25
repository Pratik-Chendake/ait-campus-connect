import jwt from 'jsonwebtoken';
import { query } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'ait_campus_connect_super_secret_jwt_key_2026';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = query.get('SELECT id, student_id, full_name, email, role, status, branch, year, semester, avatar_url, contribution_score FROM users WHERE id = ?', [decoded.id]);
    if (user) {
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Your account is currently unavailable. Contact the administrator.' });
      }
      req.user = user;
    }
    next();
  } catch (err) {
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Super Admin inherits permissions for ADMIN, ORGANIZER, etc.
    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden. Requires one of roles: ${roles.join(', ')}` });
  };
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin privileges required' });
  }
  next();
}
