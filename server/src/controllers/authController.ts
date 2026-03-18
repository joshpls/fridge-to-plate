import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import * as authService from '../services/authService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

// Helper function to generate tokens
const generateToken = (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d'
    };

    return jwt.sign(
        { id: userId, role },
        secret,
        options
    );
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        const user = await authService.registerUser({ email, password });
        const token = generateToken(user.id, user.role);

        return res.status(201).json({
            status: 'success',
            token,
            data: user,
            message: 'Registration successful'
        });
    } catch (error: any) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        const user = await authService.validateLogin({ email, password });
        const token = generateToken(user.id, user.role);

        return res.status(200).json({
            status: 'success',
            token,
            data: user,
            message: 'Login successful'
        });
    } catch (error: any) {
        return res.status(401).json({ status: 'error', message: error.message }); // 401 Unauthorized
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { firstName, lastName, alias } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { firstName, lastName, alias },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, alias: true }
        });

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const id = req?.user?.id as string;
    // req.user is populated by the requireAuth middleware
        const user = await prisma.user.findUnique({
            where: { id: id },
            select: { 
                id: true, 
                email: true, 
                role: true,
                firstName: true,
                lastName: true,
                alias: true
            }
        });
        res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
