// src/controllers/pantryController.ts
import type { Request, Response } from 'express';
import * as pantryService from '../services/pantryService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export const getIngredients = async (req: Request, res: Response) => {
  try {
    const ingredients = await pantryService.fetchAllIngredients();
    return sendSuccess(res, ingredients, "Ingredients retrieved successfully");
  } catch (error) {
    return sendError(res, "Could not fetch ingredients", 500, error);
  }
};

export const getPantry = async (req: Request, res: Response) => {
  try {
    const data = await pantryService.fetchUserPantry(TEMP_USER_ID);
    return sendSuccess(res, data, "Pantry retrieved successfully");
  } catch (error) {
    return sendError(res, "Could not fetch pantry", 500, error);
  }
};

export const savePantry = async (req: Request, res: Response) => {
  const { ingredientIds } = req.body;

  // Basic validation
  if (!Array.isArray(ingredientIds)) {
    return sendError(res, "ingredientIds must be an array", 400);
  }

  try {
    await pantryService.updateUserPantry(TEMP_USER_ID, ingredientIds);
    return sendSuccess(res, null, "Pantry updated successfully");
  } catch (error) {
    return sendError(res, "Failed to save pantry items", 500, error);
  }
};

export const bulkAddToPantry = async (req: Request, res: Response) => {
  const { userId, ingredientIds } = req.body;

  if (!Array.isArray(ingredientIds)) {
    return sendError(res, "ingredientIds must be an array", 400);
  }

  try {
    // Use the new service method to append items
    await pantryService.appendToPantry(userId || TEMP_USER_ID, ingredientIds);
    return sendSuccess(res, null, "Items added to pantry successfully");
  } catch (error) {
    return sendError(res, "Failed to bulk add pantry items", 500, error);
  }
};
