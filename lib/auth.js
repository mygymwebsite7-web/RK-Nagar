import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
