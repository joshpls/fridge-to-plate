import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authService from '../services/authService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

// Import our new utility and service
import { generateSecureToken } from '../utils/cryptoUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateAccessToken = (userId: string, role: string): string => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string, role: string): string => {
    return jwt.sign({ id: userId, role }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
};

const setRefreshCookie = (res: Response, token: string) => {
    res.cookie('jwt_refresh', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, alias } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        // Generate email verification token
        const { rawToken, hashedToken } = generateSecureToken();
        const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Pass tokens to service
        const user = await authService.registerUser({ 
            email, password, firstName, lastName, alias,
            verifyToken: hashedToken,
            verifyTokenExpires
        });
        
        // Send email asynchronously
        sendVerificationEmail(email, rawToken).catch(err => console.error("Email error:", err));

        // Note: Removed auto-login (token generation) since they must verify first.
        return res.status(201).json({
            status: 'success',
            data: user,
            message: 'Registration successful. Please check your email to verify your account.'
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
        return res.status(401).json({ status: 'error', message: error.message });
    }
};

// --- NEW CONTROLLERS ---

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ status: 'error', message: 'Token is required' });

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        await authService.verifyUserEmail(hashedToken);

        return res.status(200).json({ status: 'success', message: 'Email verified successfully. You can now log in.' });
    } catch (error: any) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: 'error', message: 'Email is required' });

        const { rawToken, hashedToken } = generateSecureToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        const user = await authService.setResetPasswordToken(email, hashedToken, expiresAt);

        if (user) {
            sendPasswordResetEmail(user.email, rawToken).catch(err => console.error("Email error:", err));
        }

        // Always return success to prevent email enumeration
        return res.status(200).json({ status: 'success', message: 'If an account exists, a reset link was sent.' });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: 'Failed to process request.' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        await authService.resetUserPassword(hashedToken, newPassword);

        return res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
    } catch (error: any) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { firstName, lastName, alias, preferences, activeHouseholdId } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { 
                firstName, 
                lastName, 
                alias,
                ...(preferences && { preferences }),
                ...(activeHouseholdId && { activeHouseholdId })
            },
            select: { 
                id: true, email: true, role: true, firstName: true, 
                lastName: true, alias: true, preferences: true, activeHouseholdId: true 
            }
        });

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

export const refreshSession = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.jwt_refresh;
        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'No refresh token found' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
        const newAccessToken = generateAccessToken(decoded.id, decoded.role);

        res.status(200).json({ status: 'success', token: newAccessToken });
    } catch (error) {
        res.clearCookie('jwt_refresh');
        res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
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
                preferences: true, activeHouseholdId: true,
                activeHousehold: {
                    select: { name: true }
                }
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
        if (error.message === 'Incorrect current password') {
            return res.status(400).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Failed to change password.' });
    }
};
