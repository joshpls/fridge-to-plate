import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';

// Define the Token Bucket
const authLimiter = new RateLimiterMemory({
    points: 50,         // Bucket capacity: Maximum burst of 50 requests
    duration: 50,       // It takes 50 seconds to completely refill an empty bucket
    execEvenly: false,  // False = allow bursts! (True = force requests to space out)
});

// Strict bucket for unauthenticated routes (e.g., login/register)
const guestLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60, // 10 requests max per minute
});

export const tokenBucketLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        const key = authHeader 
            ? authHeader.split(' ')[1].substring(0, 20) 
            : (req.ip || 'unknown_ip');
        
        const limiter = authHeader ? authLimiter : guestLimiter;

        await limiter.consume(key, 1);
        next();
    } catch (rateLimiterRes: any) {
        // The bucket is empty!
        res.status(429).json({
            status: 'error',
            message: 'You are making requests too quickly. Please take a breather for a few seconds.',
            details: {
                retryAfterSeconds: Math.round(rateLimiterRes.msBeforeNext / 1000) || 1
            }
        });
    }
};
