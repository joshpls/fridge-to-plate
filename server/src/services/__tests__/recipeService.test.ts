import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as recipeService from '../recipeService.js';
import { prisma } from '../../config/db.js';
import { mapRecipeToDto, generateUniqueSlug } from '../../utils/helperFunctions.js';

// --- MOCK DEFINITIONS --- //

vi.mock('../../config/db.js', () => ({
  prisma: {
    // Mock the transaction to immediately execute the callback with the prisma mock
    $transaction: vi.fn(async (cb) => cb(prisma)),
    category: { findUnique: vi.fn() },
    recipe: { 
      create: vi.fn(), 
      update: vi.fn(), 
      delete: vi.fn(), 
      findUnique: vi.fn(), 
      findMany: vi.fn() 
    },
    recipeIngredient: { deleteMany: vi.fn() },
    pantryItem: { findMany: vi.fn() },
    householdStaple: { findMany: vi.fn() },
    favorite: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() }
  }
}));

vi.mock('../../utils/helperFunctions.js', () => ({
  mapRecipeToDto: vi.fn((recipe) => ({ ...recipe, mapped: true })),
  generateUniqueSlug: vi.fn((name) => `${name}-slug`)
}));

describe('Recipe Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default household context responses
    vi.mocked(prisma.pantryItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.householdStaple.findMany).mockResolvedValue([]);
  });

  describe('createRecipe', () => {
    const mockData = {
      name: 'Test Recipe',
      categoryId: 'cat-1',
      ingredients: [{ amount: '2', ingredientId: 'ing-1', unitId: 'unit-1' }]
    };

    it('should throw an error if the category does not exist', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(recipeService.createRecipe('user-1', 'house-1', mockData))
        .rejects
        .toThrow('Category not found.'); //
    });

    it('should create a recipe successfully', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as any);
      vi.mocked(prisma.recipe.create).mockResolvedValue({ id: 'recipe-1', name: 'Test Recipe' } as any);

      const result = await recipeService.createRecipe('user-1', 'house-1', mockData);

      expect(generateUniqueSlug).toHaveBeenCalledWith('Test Recipe'); //
      expect(prisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Recipe',
            slug: 'Test Recipe-slug',
            author: { connect: { id: 'user-1' } }, //
            household: { connect: { id: 'house-1' } } //[cite: 4]
          })
        })
      );
      expect(result).toEqual({ id: 'recipe-1', name: 'Test Recipe' });
    });
  });

  describe('updateRecipe', () => {
    const updateData = {
      name: 'Updated Recipe',
      categoryId: 'cat-1',
      ingredients: []
    };

    it('should throw an error if recipe is not found or unauthorized', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ authorId: 'other-user' } as any);

      await expect(recipeService.updateRecipe('recipe-1', 'user-1', updateData, 'USER'))
        .rejects
        .toThrow('Unauthorized or Recipe not found.'); //[cite: 4]
    });

    it('should update the recipe if authorized (as author or ADMIN)', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ authorId: 'other-user', visibility: 'PUBLIC' } as any);
      vi.mocked(prisma.recipe.update).mockResolvedValue({ id: 'recipe-1' } as any);

      // Testing ADMIN override[cite: 4]
      await recipeService.updateRecipe('recipe-1', 'user-1', updateData, 'ADMIN');

      // It should delete existing ingredients before updating[cite: 4]
      expect(prisma.recipeIngredient.deleteMany).toHaveBeenCalledWith({ where: { recipeId: 'recipe-1' } });
      expect(prisma.recipe.update).toHaveBeenCalled();
    });
  });

  describe('deleteRecipe', () => {
    it('should throw an error if user is not author and not admin', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ authorId: 'other-user' } as any);

      await expect(recipeService.deleteRecipe('recipe-1', 'user-1', 'USER'))
        .rejects
        .toThrow('Unauthorized'); //[cite: 4]
    });

    it('should delete the recipe if user is the author', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ authorId: 'user-1' } as any);
      
      await recipeService.deleteRecipe('recipe-1', 'user-1', 'USER');

      expect(prisma.recipe.delete).toHaveBeenCalledWith({ where: { id: 'recipe-1' } }); //[cite: 4]
    });
  });

  describe('getRecipeBySlug', () => {
    it('should return null if recipe is PRIVATE and user is not author', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({
        visibility: 'PRIVATE',
        authorId: 'other-user'
      } as any);

      const result = await recipeService.getRecipeBySlug('some-slug', 'user-1');

      expect(result).toBeNull(); //[cite: 4]
    });

    it('should return mapped DTO if recipe is found and public', async () => {
      const mockRecipe = { id: 'recipe-1', visibility: 'PUBLIC' };
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(mockRecipe as any);

      const result = await recipeService.getRecipeBySlug('some-slug', 'user-1');

      expect(mapRecipeToDto).toHaveBeenCalled(); //[cite: 4]
      expect(result).toEqual({ ...mockRecipe, mapped: true });
    });
  });

  describe('toggleRecipeFavorite', () => {
    it('should throw an error if recipe is not found', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(null);

      await expect(recipeService.toggleRecipeFavorite('user-1', 'house-1', 'bad-slug'))
        .rejects
        .toThrow('Recipe not found'); //[cite: 4]
    });

    it('should delete favorite if it already exists', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ id: 'recipe-1' } as any);
      vi.mocked(prisma.favorite.findUnique).mockResolvedValue({ userId: 'user-1' } as any);

      const result = await recipeService.toggleRecipeFavorite('user-1', 'house-1', 'some-slug');

      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_recipeId: { userId: 'user-1', recipeId: 'recipe-1' } } //[cite: 4]
      });
      expect(result).toEqual({ favorited: false }); //[cite: 4]
    });

    it('should create favorite if it does not exist', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue({ id: 'recipe-1' } as any);
      vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null);

      const result = await recipeService.toggleRecipeFavorite('user-1', 'house-1', 'some-slug');

      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', recipeId: 'recipe-1', householdId: 'house-1' } //[cite: 4]
      });
      expect(result).toEqual({ favorited: true }); //[cite: 4]
    });
  });

  describe('getMatches', () => {
    it('should fetch recipes using household context and map them to DTO', async () => {
      vi.mocked(prisma.recipe.findMany).mockResolvedValue([{ id: 'recipe-1', name: 'Zebra Cake' }] as any);
      
      const result = await recipeService.getMatches('user-1', 'house-1', { limit: 12, page: 1 } as any);

      expect(prisma.pantryItem.findMany).toHaveBeenCalledWith({
        where: { householdId: 'house-1' },
        include: { ingredient: { select: { subGroupId: true } } } //[cite: 4]
      });
      
      expect(prisma.householdStaple.findMany).toHaveBeenCalledWith({
        where: { householdId: 'house-1' } //[cite: 4]
      });

      expect(mapRecipeToDto).toHaveBeenCalled(); //[cite: 4]
      expect(result.totalCount).toBe(1); //[cite: 4]
      expect(result.recipes[0]).toHaveProperty('mapped', true);
    });
  });
});
