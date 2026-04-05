import type { Response } from 'express';
import * as pantryService from '../services/pantryService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const getPantry = async (req: AuthRequest, res: Response) => {
  try {
    const householdId = req.user!.activeHouseholdId; 
    
    const data = await pantryService.fetchHouseholdPantry(householdId);
    return sendSuccess(res, data, "Household pantry retrieved successfully");
  } catch (error) {
    return sendError(res, "Could not fetch pantry", 500, error);
  }
};

export const savePantry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const householdId = req.user!.activeHouseholdId;
    const { ingredientIds } = req.body;

    if (!Array.isArray(ingredientIds)) {
      return sendError(res, "ingredientIds must be an array", 400);
    }

    await pantryService.updateHouseholdPantry(householdId, ingredientIds, userId);
    return sendSuccess(res, null, "Household pantry updated successfully");
  } catch (error) {
    return sendError(res, "Failed to save pantry items", 500, error);
  }
};

export const bulkAddToPantry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const householdId = req.user!.activeHouseholdId;
    const { ingredientIds } = req.body;

    if (!Array.isArray(ingredientIds)) {
      return sendError(res, "ingredientIds must be an array", 400);
    }

    await pantryService.appendToHouseholdPantry(householdId, ingredientIds, userId);
    return sendSuccess(res, null, "Items added to household pantry successfully");
  } catch (error) {
    return sendError(res, "Failed to bulk add pantry items", 500, error);
  }
};
