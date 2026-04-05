import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        activeHouseholdId: string;
    };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: No token provided.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, role: string };
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { activeHouseholdId: true, email: true }
        });

        if (!user || !user.activeHouseholdId) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: Invalid user or household state.' 
            });
        }
        
        req.user = {
            id: decoded.id,
            email: user.email,
            role: decoded.role,
            activeHouseholdId: user.activeHouseholdId
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: Invalid or expired token.' 
        });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Please log in.' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Forbidden: Admin access required.' 
        });
    }

    next();
};
