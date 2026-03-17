// server/src/middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Extend the Express Request interface to include our JWT payload
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

// 2. The Authentication Bouncer
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Standard OAuth2 pattern: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: No token provided.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using your secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, email: string, role: string };
        
        // Attach the decoded user data to the request object
        req.user = decoded;
        
        // Let them pass to the next function (the controller)
        next();
    } catch (error) {
        // If the token is expired or tampered with, it throws an error
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: Invalid or expired token.' 
        });
    }
};

// 3. The Authorization Bouncer (Admins Only)
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    // This MUST run after requireAuth, so req.user should already exist
    if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Please log in.' });
    }

    if (req.user.role !== 'ADMIN') {
        // 403 Forbidden means "I know who you are, but you don't have permission"
        return res.status(403).json({ 
            status: 'error', 
            message: 'Forbidden: Admin access required.' 
        });
    }

    next();
};
