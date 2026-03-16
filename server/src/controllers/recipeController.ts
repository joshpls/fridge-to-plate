import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { mapRecipeToDto } from '../utils/helperFunctions.js';
import { prisma } from '../config/db.js';

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export const getMatches = async (req: Request, res: Response) => {
  try {
    // 1. Extract filters and pagination from the URL query
    const { categoryId, search, tags, page, limit } = req.query;
    
    const filters = {
      categoryId: categoryId as string,
      search: search as string,
      tags: tags as string,
    };
    
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12, // Default to 12 recipes per page
    };

    // 2. Pass to service
    const matchData = await recipeService.getMatches(TEMP_USER_ID, filters, pagination);
    
    return sendSuccess(res, matchData, "Recipe matches found");
  } catch (error) {
    return sendError(res, "Failed to match recipes", 500, error);
  }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        return sendSuccess(res, categories, "Categories retrieved successfully");
    } catch (error) {
        return sendError(res, "Could not fetch categories", 500, error);
    }
};

// ADD THIS: Endpoint to get tags for your frontend filters
export const getTags = async (req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        return sendSuccess(res, tags, "Tags retrieved successfully");
    } catch (error) {
        return sendError(res, "Could not fetch tags", 500, error);
    }
};

export const getTaxonomy = async (req: Request, res: Response) => {
    try {
        const [categories, subcategories, tags, units, ingredients] = await Promise.all([
            prisma.category.findMany({ orderBy: { name: 'asc' } }),
            prisma.subcategory.findMany({ orderBy: { name: 'asc' } }),
            prisma.tag.findMany({ orderBy: { name: 'asc' } }),
            prisma.unit.findMany({ orderBy: { name: 'asc' } }),
            prisma.ingredient.findMany({ orderBy: { name: 'asc' } })
        ]);
        
        return sendSuccess(res, { categories, subcategories, tags, units, ingredients }, "Taxonomy retrieved");
    } catch (error) {
        return sendError(res, "Could not fetch taxonomy", 500, error);
    }
};

// server/src/controllers/recipeController.ts

export const createRecipe = async (req: Request, res: Response) => {
  try {
    const { userId, ...recipeData } = req.body;

    // 1. Basic Validation Boundary
    if (!recipeData.name || !recipeData.categoryId || !recipeData.instructions) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields (Name, Category, Instructions)' 
      });
    }

    if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'A recipe must have at least one ingredient.' 
      });
    }

    // 2. Execute the Service
    const newRecipe = await recipeService.createRecipe(userId, recipeData);

    // 3. Return Success
    // (Assuming sendSuccess uses a standard { status: 'success', data, message } format)
    return res.status(201).json({
        status: 'success',
        data: newRecipe,
        message: 'Recipe created successfully'
    });

  } catch (error: any) {
    console.error("Error creating recipe:", error);

    // Handle Prisma Unique Constraint Violation (e.g., duplicate slug/name)
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'A recipe with this name already exists. Please choose a different name or modify it.' 
      });
    }

    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create recipe due to a server error.' 
    });
  }
};

// Admin Only: Add an Ingredient
export const createIngredient = async (req: Request, res: Response) => {
    try {
        const { userId, name, isStaple } = req.body;
        
        // Verify Admin (In the future, extract this to an authMiddleware)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
        }

        const ingredient = await prisma.ingredient.create({
            data: { name, isStaple: isStaple || false }
        });
        return sendSuccess(res, ingredient, "Ingredient created");
    } catch (error) {
        return sendError(res, "Failed to create ingredient", 500, error);
    }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id; // Passed via URL
    const { userId, ...recipeData } = req.body;

    const updatedRecipe = await recipeService.updateRecipe(recipeId, userId, recipeData);

    return res.status(200).json({
        status: 'success',
        data: updatedRecipe,
        message: 'Recipe updated successfully'
    });
  } catch (error: any) {
    console.error("Error updating recipe:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRecipeDetail = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const userId = req.query.userId as string;

  if (!slug || !userId) {
    return res.status(400).json({ status: 'error', message: 'Missing slug or userId' });
  }

  try {
    const recipeDto = await recipeService.getRecipeBySlug(slug, userId);

    if (!recipeDto) {
      return res.status(404).json({ status: 'error', message: 'Recipe not found' });
    }

    res.status(200).json({ 
      status: 'success', 
      data: recipeDto 
    });
  } catch (error) {
    console.error("Error in getRecipeDetail:", error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const handleToggleFavorite = async (req: Request, res: Response) => {
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
