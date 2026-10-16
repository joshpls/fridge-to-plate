import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pantryService from '../pantryService.js';
import { prisma } from '../../config/db.js';

// --- MOCK DEFINITIONS --- //
vi.mock('../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn(async (cb) => cb(prisma)),
    pantryItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn()
    }
  }
}));

describe('Pantry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchHouseholdPantry', () => {
    it('should fetch and return pantry items ordered by createdAt descending with relations', async () => {
      const mockItems = [
        { id: 'pantry-1', householdId: 'house-1', ingredientId: 'ing-1', quantity: 2, unitId: 'unit-1' },
        { id: 'pantry-2', householdId: 'house-1', ingredientId: 'ing-2', quantity: 1, unitId: null }
      ];
      vi.mocked(prisma.pantryItem.findMany).mockResolvedValue(mockItems as any);

      const result = await pantryService.fetchHouseholdPantry('house-1');

      expect(prisma.pantryItem.findMany).toHaveBeenCalledWith({
        where: { householdId: 'house-1' },
        include: {
          ingredient: true,
          unit: true,
          addedBy: { select: { alias: true, firstName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if pantry is empty', async () => {
      vi.mocked(prisma.pantryItem.findMany).mockResolvedValue([]);

      const result = await pantryService.fetchHouseholdPantry('house-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateHouseholdPantry', () => {
    it('should clear existing pantry items and return true when items list is empty', async () => {
      const result = await pantryService.updateHouseholdPantry('house-1', [], 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.pantryItem.deleteMany).toHaveBeenCalledWith({
        where: { householdId: 'house-1' }
      });
      expect(prisma.pantryItem.createMany).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delete existing items and create new ones with parsed quantities and dates', async () => {
      const itemsToUpdate = [
        {
          ingredientId: 'ing-1',
          quantity: '2.5',
          unitId: 'unit-1',
          expiresAt: '2026-12-31T00:00:00.000Z'
        },
        {
          ingredientId: 'ing-2',
          quantity: undefined,
          unitId: null,
          expiresAt: null
        }
      ];

      const result = await pantryService.updateHouseholdPantry('house-1', itemsToUpdate, 'user-1');

      expect(prisma.pantryItem.deleteMany).toHaveBeenCalledWith({
        where: { householdId: 'house-1' }
      });
      expect(prisma.pantryItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            householdId: 'house-1',
            ingredientId: 'ing-1',
            addedById: 'user-1',
            quantity: 2.5,
            unitId: 'unit-1',
            expiresAt: new Date('2026-12-31T00:00:00.000Z')
          },
          {
            householdId: 'house-1',
            ingredientId: 'ing-2',
            addedById: 'user-1',
            quantity: null,
            unitId: null,
            expiresAt: null
          }
        ],
        skipDuplicates: true
      });
      expect(result).toBe(true);
    });

    it('should handle numeric quantities passed directly without throwing', async () => {
      const itemsToUpdate = [
        {
          ingredientId: 'ing-1',
          quantity: 5 as any,
          unitId: 'unit-1'
        }
      ];

      await pantryService.updateHouseholdPantry('house-1', itemsToUpdate, 'user-1');

      expect(prisma.pantryItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            householdId: 'house-1',
            ingredientId: 'ing-1',
            addedById: 'user-1',
            quantity: 5,
            unitId: 'unit-1',
            expiresAt: null
          }
        ],
        skipDuplicates: true
      });
    });
  });

  describe('appendToHouseholdPantry', () => {
    it('should return true immediately without calling createMany if items list is empty', async () => {
      const result = await pantryService.appendToHouseholdPantry('house-1', [], 'user-1');

      expect(prisma.pantryItem.createMany).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should append new items correctly with parsed numbers and dates', async () => {
      const itemsToAppend = [
        {
          ingredientId: 'ing-3',
          quantity: '10',
          unitId: 'unit-2',
          expiresAt: '2027-01-01T00:00:00.000Z'
        }
      ];

      const result = await pantryService.appendToHouseholdPantry('house-1', itemsToAppend, 'user-1');

      expect(prisma.pantryItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            householdId: 'house-1',
            ingredientId: 'ing-3',
            addedById: 'user-1',
            quantity: 10,
            unitId: 'unit-2',
            expiresAt: new Date('2027-01-01T00:00:00.000Z')
          }
        ],
        skipDuplicates: true
      });
      expect(result).toBe(true);
    });
  });

  describe('removeMultipleFromHouseholdPantry', () => {
    it('should remove multiple pantry items matching household and ingredient IDs', async () => {
      const ingredientIds = ['ing-1', 'ing-2'];
      
      await pantryService.removeMultipleFromHouseholdPantry('house-1', ingredientIds);

      expect(prisma.pantryItem.deleteMany).toHaveBeenCalledWith({
        where: {
          householdId: 'house-1',
          ingredientId: { in: ingredientIds }
        }
      });
    });

    it('should handle empty ingredientIds array without error', async () => {
      await pantryService.removeMultipleFromHouseholdPantry('house-1', []);

      expect(prisma.pantryItem.deleteMany).toHaveBeenCalledWith({
        where: {
          householdId: 'house-1',
          ingredientId: { in: [] }
        }
      });
    });
  });
});
