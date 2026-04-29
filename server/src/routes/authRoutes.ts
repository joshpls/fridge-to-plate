import express from 'express';
import { 
    register, login, getMe, updateProfile, refreshSession, logout, changePassword,
    verifyEmail, forgotPassword, resetPassword
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshSession);
router.post('/logout', logout);

// New Public Email/Password flow Routes
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Routes
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);
router.get('/me', requireAuth, getMe);

export default router;
