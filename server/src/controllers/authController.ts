import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import * as authService from '../services/authService.js';

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
