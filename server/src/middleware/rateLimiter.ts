// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5, 
    message: { status: 'error', message: 'Too many attempts, please try again in 10 minutes.' },
    skipSuccessfulRequests: true, // Only punish the failures!
});
