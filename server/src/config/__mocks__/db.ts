// src/config/__mocks__/db.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { vi, beforeEach } from 'vitest'; // Fixes "Cannot find name 'vi'" and 'beforeEach'
import { prisma } from '../db.js';       // Fixes "has no default export"

vi.mock('../db.js', () => ({
  prisma: mockDeep<PrismaClient>(),
  pool: { on: vi.fn() },
}));

beforeEach(() => {
  mockReset(mockPrisma);
});

export const mockPrisma = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;