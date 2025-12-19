import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: number;
  address: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15d', // Token 15天后过期
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed===>\n', error,'\n');
    return null;
  }
}

export function getTokenFromRequest(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  // 支持 "Bearer token" 格式
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1] ?? null;
  }
  
  // 直接返回token
  return authHeader;
}