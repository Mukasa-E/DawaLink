import jwt from 'jsonwebtoken';
import type { UserRole } from '../types';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret) as JWTPayload;
}

