// src/middleware/__tests__/authMiddleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin, type AuthRequest } from '../authMiddleware.js';
import { prisma } from '../../config/db.js';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('../../config/db.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

describe('Auth Middleware', () => {
    const mockRequest = (headers: Record<string, string> = {}, user?: AuthRequest['user']) => {
        return {
            headers,
            user,
        } as unknown as AuthRequest;
    };

    const mockResponse = () => {
        const res = {} as Response;
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    const next: NextFunction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('requireAuth', () => {
        it('should return 401 if no authorization header is present', async () => {
            const req = mockRequest({});
            const res = mockResponse();

            await requireAuth(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized: No token provided.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header does not start with Bearer', async () => {
            const req = mockRequest({ authorization: 'Basic 12345' });
            const res = mockResponse();

            await requireAuth(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized: No token provided.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token verification fails', async () => {
            const req = mockRequest({ authorization: 'Bearer invalid.token' });
            const res = mockResponse();

            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await requireAuth(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized: Invalid or expired token.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not found or activeHouseholdId is missing', async () => {
            const req = mockRequest({ authorization: 'Bearer valid.token' });
            const res = mockResponse();

            vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'USER' } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await requireAuth(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized: Invalid user or household state.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should set req.user and call next() if token and user state are valid', async () => {
            const req = mockRequest({ authorization: 'Bearer valid.token' });
            const res = mockResponse();

            vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'USER' } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                activeHouseholdId: 'house-123',
                email: 'test@example.com',
            } as any);

            await requireAuth(req as any, res, next);

            expect(req.user).toEqual({
                id: 'user-1',
                email: 'test@example.com',
                role: 'USER',
                activeHouseholdId: 'house-123',
            });
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('requireAdmin', () => {
        it('should return 401 if req.user is undefined', () => {
            const req = mockRequest({});
            const res = mockResponse();

            requireAdmin(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized: Please log in.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if req.user role is not ADMIN', () => {
            const req = mockRequest({}, { id: 'user-1', role: 'USER', activeHouseholdId: '', email: 'user@email.com' });
            const res = mockResponse();

            requireAdmin(req as any, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Forbidden: Admin access required.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next() if req.user role is ADMIN', () => {
            const req = mockRequest({}, { id: 'user-1', role: 'ADMIN', activeHouseholdId: '', email: 'user@email.com' });
            const res = mockResponse();

            requireAdmin(req as any, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});