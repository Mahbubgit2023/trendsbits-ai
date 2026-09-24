import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Get user from request cookie/header
export function getUser(req) {
  const auth = req.headers.authorization || '';
  const cookie = req.cookies?.token || '';
  const token = auth.replace('Bearer ', '') || cookie;
  if (!token) return null;
  return verifyToken(token);
}
