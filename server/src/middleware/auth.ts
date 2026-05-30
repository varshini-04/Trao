import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

interface DecodedToken {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    // 1. Get token from header or cookie
    let token = '';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
      // Basic cookie parsing
      const cookies = req.headers.cookie.split(';').reduce((acc, curr) => {
        const [key, value] = curr.split('=').map(c => c.trim());
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      token = cookies['token'] || '';
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    // 2. Verify token
    const secret = process.env.JWT_SECRET || 'supersecretjwttokenforaitravelplannerapp';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // 3. Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
