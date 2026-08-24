import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Users, User } from '../models/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required.');
  }
  const weakSecrets = new Set(['secret', 'changeme', 'change_me', 'development-secret', 'dev-secret', '123456', 'password']);
  if (process.env.NODE_ENV === 'production' && (secret.length < 32 || weakSecrets.has(secret.trim().toLowerCase()))) {
    throw new Error('A strong JWT_SECRET of at least 32 characters is required in production.');
  }
  return secret;
}

export function sanitizeUser(user: User) {
  const safeUser = { ...user } as any;
  delete safeUser.passwordHash;
  return safeUser;
}

function redactErrorForLog(error: any) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, 'Bearer [REDACTED]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgresql://[REDACTED]')
    .replace(/(AI_|GEMINI_|OPENAI_|JWT_|DATABASE_)[A-Z0-9_]*=([^\s]+)/gi, '$1[REDACTED]');
}

export function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { _id: string; role: string };
    
    Users.findById(decoded._id).then((user) => {
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Please contact the administrator.',
        });
      }

      req.user = user;
      next();
    }).catch((err) => {
      console.error('Error fetching user in auth middleware:', process.env.NODE_ENV === 'production' ? redactErrorForLog(err) : err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.',
      });
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

export function authorize(roles: ('ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

// Error handling middleware
export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error: ', err);
  } else {
    console.error('API Error: ', redactErrorForLog(err));
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status >= 500
    ? 'An unexpected error occurred on the server'
    : err.message || 'An unexpected error occurred on the server';

  res.status(status).json({
    success: false,
    message,
    errors: process.env.NODE_ENV === 'production' && status >= 500 ? [] : err.errors || [],
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
}
