import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export const getMatches = async (req: Request, res: Response) => {
  try {
    const matches = await recipeService.getMatches(TEMP_USER_ID);
    return sendSuccess(res, matches, "Recipe matches found");
  } catch (error) {
    return sendError(res, "Failed to match recipes", 500, error);
  }
};

export const handleToggleFavorite = async (req: Request, res: Response) => {
  // Use casting to tell TypeScript these are strings
  const slug = req.params.slug as string;
  const userId = req.body.userId as string;

  if (!slug || !userId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing slug or userId' 
    });
  }

  try {
    const result = await recipeService.toggleRecipeFavorite(userId, slug);
    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    const statusCode = error.message === 'Recipe not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  // Casting userId to string to satisfy TypeScript
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'userId is required to fetch favorites' 
    });
  }

  try {
    const favorites = await recipeService.getFavoriteRecipes(userId);
    res.status(200).json({ 
      status: 'success', 
      data: favorites 
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve favorites' 
    });
  }
};
