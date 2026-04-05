// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes window
    max: (req) => {
        if (req.headers.authorization || (req as any).user) {
            return 300; 
        }
        return 30; 
    },
    
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            status: 'error',
            message: 'You are making requests too quickly, please try again in 5 minutes.',
            details: null
        });
    }
});

export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5, 
    message: { status: 'error', message: 'Too many attempts, please try again in 5 minutes.' },
    skipSuccessfulRequests: true,
});
