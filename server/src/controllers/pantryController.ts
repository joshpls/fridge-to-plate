// src/controllers/pantryController.ts
import type { Response } from 'express';
import * as pantryService from '../services/pantryService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const getPantry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Secured by requireAuth
    const data = await pantryService.fetchUserPantry(userId);
    return sendSuccess(res, data, "Pantry retrieved successfully");
  } catch (error) {
    return sendError(res, "Could not fetch pantry", 500, error);
  }
};

export const savePantry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ingredientIds } = req.body;

    if (!Array.isArray(ingredientIds)) {
      return sendError(res, "ingredientIds must be an array", 400);
    }

    await pantryService.updateUserPantry(userId, ingredientIds);
    return sendSuccess(res, null, "Pantry updated successfully");
  } catch (error) {
    return sendError(res, "Failed to save pantry items", 500, error);
  }
};

export const bulkAddToPantry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ingredientIds } = req.body;

    if (!Array.isArray(ingredientIds)) {
      return sendError(res, "ingredientIds must be an array", 400);
    }

    await pantryService.appendToPantry(userId, ingredientIds);
    return sendSuccess(res, null, "Items added to pantry successfully");
  } catch (error) {
    return sendError(res, "Failed to bulk add pantry items", 500, error);
  }
};
