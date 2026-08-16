import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Users, User } from '../models/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required.');
  }
  return process.env.JWT_SECRET;
}

export function sanitizeUser(user: User) {
  const safeUser = { ...user } as any;
  delete safeUser.passwordHash;
  return safeUser;
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
      console.error('Error fetching user in auth middleware:', err);
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
    console.error('API Error: ', err.message);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server';

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
}
