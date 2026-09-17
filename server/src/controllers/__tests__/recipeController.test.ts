// src/controllers/__tests__/recipeController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

// Import the controller to test
import * as recipeController from '../recipeController.js';

// Import modules to mock
import * as recipeService from '../../services/recipeService.js';
import { sendSuccess, sendError } from '../../utils/responseHandler.js';
import { prisma } from '../../config/db.js';

// --- MOCK DEFINITIONS ---

vi.mock('../../services/recipeService.js');
vi.mock('../../utils/responseHandler.js');
vi.mock('jsonwebtoken');
vi.mock('fs/promises');

// Mock Prisma deeply
vi.mock('../../config/db.js', () => ({
  prisma: {
    category: { findMany: vi.fn() },
    tag: { findMany: vi.fn() },
    unit: { findMany: vi.fn() },
    ingredient: { findMany: vi.fn() },
    modifier: { findMany: vi.fn() },
    ingredientCategory: { findMany: vi.fn() },
    substitutionGroup: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    recipe: { findUnique: vi.fn() },
    comment: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() }
  }
}));

// --- HELPER FUNCTIONS ---

const mockRequest = (overrides = {}) => {
  return {
    query: {},
    params: {},
    body: {},
    headers: {},
    user: undefined, // Used for AuthRequest
    ...overrides,
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// --- TESTS ---

describe('Recipe Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return categories successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const mockCategories = [{ id: '1', name: 'Dinner' }];
      
      // Mock the Prisma call
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

      await recipeController.getCategories(req, res);

      expect(prisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(sendSuccess).toHaveBeenCalledWith(res, mockCategories, "Categories retrieved successfully");
    });

    it('should handle database errors', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const dbError = new Error('DB connection failed');
      
      vi.mocked(prisma.category.findMany).mockRejectedValue(dbError);

      await recipeController.getCategories(req, res);

      expect(sendError).toHaveBeenCalledWith(res, "Could not fetch categories", 500, dbError);
    });
  });

  describe('getMatches', () => {
    it('should extract user info from token fallback and call service with parsed filters', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer valid-token' },
        query: { page: '2', limit: '20', scope: 'household' }
      });
      const res = mockResponse();
      const mockUserId = 'user-123';
      const mockHouseholdId = 'household-456';
      
      // Mock JWT decoding and DB user lookup
      vi.mocked(jwt.verify).mockReturnValue({ id: mockUserId } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ activeHouseholdId: mockHouseholdId } as any);
      vi.mocked(recipeService.getMatches).mockResolvedValue({ recipes: [], total: 0 } as any);

      await recipeController.getMatches(req, res);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { activeHouseholdId: true }
      });

      // Verify the service was called with the correct extracted and parsed data
      expect(recipeService.getMatches).toHaveBeenCalledWith(
        mockUserId,
        mockHouseholdId,
        expect.objectContaining({ scope: 'household' }),
        { page: 2, limit: 20 }
      );
      
      expect(sendSuccess).toHaveBeenCalled();
    });
  });

  describe('createRecipe', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({
        user: { id: 'user-1', activeHouseholdId: 'house-1' },
        body: { name: 'Incomplete Recipe' } // Missing categoryId and instructions
      });
      const res = mockResponse();

      await recipeController.createRecipe(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Missing required fields' });
      expect(recipeService.createRecipe).not.toHaveBeenCalled();
    });

    it('should successfully create a recipe and return 201', async () => {
      const req = mockRequest({
        user: { id: 'user-1', activeHouseholdId: 'house-1' },
        body: { 
          name: 'Good Recipe', 
          categoryId: 'cat-1', 
          instructions: 'Cook it',
          ingredients: [{ id: 'ing-1' }]
        }
      });
      const res = mockResponse();
      const createdRecipe = { id: 'recipe-1', name: 'Good Recipe' };

      vi.mocked(recipeService.createRecipe).mockResolvedValue(createdRecipe as any);

      await recipeController.createRecipe(req as any, res);

      expect(recipeService.createRecipe).toHaveBeenCalledWith('user-1', 'house-1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: createdRecipe });
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe and unlink local image if present', async () => {
      const req = mockRequest({
        params: { id: 'recipe-123' },
        user: { id: 'user-1', role: 'ADMIN' }
      });
      const res = mockResponse();
      
      // Mock finding an existing recipe with an image[cite: 3]
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ imageUrl: '/uploads/test-image.jpg' } as any);
      vi.mocked(recipeService.deleteRecipe).mockResolvedValue({ id: 'recipe-123' } as any);

      await recipeController.deleteRecipe(req as any, res);

      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'recipe-123' }, select: { imageUrl: true }
      });
      expect(recipeService.deleteRecipe).toHaveBeenCalledWith('recipe-123', 'user-1', 'ADMIN');
      
      // Verify fs.unlink was called for the image
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'Recipe deleted successfully' });
    });
  });
});