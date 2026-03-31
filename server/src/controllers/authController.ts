import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import * as authService from '../services/authService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

// Generate Access Token (Short lived)
const generateAccessToken = (userId: string, role: string): string => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' } // 15 minutes
    );
};

// Generate Refresh Token (Long lived)
const generateRefreshToken = (userId: string, role: string): string => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' } // 7 days
    );
};

//Helper to set the HttpOnly cookie
const setRefreshCookie = (res: Response, token: string) => {
    res.cookie('jwt_refresh', token, {
        httpOnly: true, // Javascript cannot access this (prevents XSS)
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        sameSite: 'lax', // Protects against CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, alias } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        const user = await authService.registerUser({ email, password, firstName, lastName, alias });
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);
        
        setRefreshCookie(res, refreshToken);

        return res.status(201).json({
            status: 'success',
            accessToken,
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
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);

        setRefreshCookie(res, refreshToken);

        return res.status(200).json({
            status: 'success',
            token: accessToken,
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
        const { firstName, lastName, alias, preferences } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { 
                firstName, 
                lastName, 
                alias,
                ...(preferences && { preferences })
            },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, alias: true, preferences: true }
        });

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

export const refreshSession = async (req: Request, res: Response) => {
    try {
        // 1. Grab the refresh token from the secure cookie
        const refreshToken = req.cookies.jwt_refresh;
        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'No refresh token found' });
        }

        // 2. Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

        // 3. Issue a fresh Access Token
        const newAccessToken = generateAccessToken(decoded.id, decoded.role);

        res.status(200).json({ status: 'success', token: newAccessToken });
    } catch (error) {
        // If the refresh token is expired or tampered with, clear it
        res.clearCookie('jwt_refresh');
        res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    // Clear the secure cookie to fully log the user out
    res.clearCookie('jwt_refresh');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
        const id = req?.user?.id as string;
        const user = await prisma.user.findUnique({
            where: { id: id },
            select: { 
                id: true, email: true, role: true,
                firstName: true, lastName: true, alias: true,
                preferences: true
            }
        });
        res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Both current and new passwords are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters.' });
        }

        await authService.updatePassword(userId, currentPassword, newPassword);

        res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
    } catch (error: any) {
        // Return 400 for incorrect password so the frontend knows it was a validation error
        if (error.message === 'Incorrect current password') {
            return res.status(400).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Failed to change password.' });
    }
};
