import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', requireAuth, getMe);

export default router;
