import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { mapRecipeToDto } from '../utils/helperFunctions.js';
import { prisma } from '../config/db.js';

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export const getMatches = async (req: Request, res: Response) => {
  try {
    const matches = await recipeService.getMatches(TEMP_USER_ID);
    return sendSuccess(res, matches, "Recipe matches found");
  } catch (error) {
    return sendError(res, "Failed to match recipes", 500, error);
  }
};

export const getRecipeDetail = async (req: Request, res: Response) => {
  // Use "as string" to cast the types explicitly
  const slug = req.params.slug as string;
  const userId = req.query.userId as string;

  // Check if they actually exist before proceeding
  if (!slug || !userId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing slug in params or userId in query' 
    });
  }

  try {
    const recipe = await recipeService.getRecipeBySlug(slug, userId);
    
    if (!recipe) {
      return res.status(404).json({ status: 'error', message: 'Recipe not found' });
    }
    
    const pantryEntries = await prisma.pantryItem.findMany({ where: { userId } });
    const pantryIds = new Set(pantryEntries.map(p => p.ingredientId));
    
    // Pass the cleaned data through your helper
    res.json({ status: 'success', data: mapRecipeToDto(recipe, pantryIds) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error' });
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
