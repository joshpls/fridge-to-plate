import express from 'express';
import { register, login, getMe, updateProfile, refreshSession, logout, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshSession);
router.post('/logout', logout);

router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);
router.get('/me', requireAuth, getMe);

export default router;
