import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { mapRecipeToDto } from '../utils/helperFunctions.js';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';

export const getMatches = async (req: Request, res: Response) => {
  try {
    let userId = (req as any).user?.id;

    // If the route isn't strictly protected, manually decode the token if it exists
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            userId = decoded.id;
        } catch (e) {
            // Token is invalid or expired. Ignore and treat as a guest.
        }
    }

    // Extract all the new filters from the URL query
    const { 
      categoryId, 
      subcategoryId, 
      search, 
      tags, 
      includeIngredients, 
      excludeIngredients, 
      favoritesOnly, 
      sort, 
      page, 
      limit 
    } = req.query;
    
    const filters = {
      categoryId: categoryId as string,
      subcategoryId: subcategoryId as string,
      search: search as string,
      tags: tags as string,
      includeIngredients: includeIngredients as string,
      excludeIngredients: excludeIngredients as string,
      favoritesOnly: favoritesOnly as string,
      sort: sort as 'asc' | 'desc',
    };
    
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12,
    };

    const matchData = await recipeService.getMatches(userId, filters, pagination);
    
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
        const [categories, tags, units, ingredients] = await Promise.all([
            // Nest subcategories directly inside categories
            prisma.category.findMany({ 
                orderBy: { name: 'asc' },
                include: { 
                    subcategories: {
                        orderBy: { name: 'asc' }
                    }
                }
            }),
            prisma.tag.findMany({ orderBy: { name: 'asc' } }),
            prisma.unit.findMany({ orderBy: { name: 'asc' } }),
            prisma.ingredient.findMany({ orderBy: { name: 'asc' } })
        ]);
        
        return sendSuccess(res, { categories, tags, units, ingredients }, "Taxonomy retrieved");
    } catch (error) {
        return sendError(res, "Could not fetch taxonomy", 500, error);
    }
};


// Notice we change `req: Request` to `req: AuthRequest`
export const createRecipe = async (req: AuthRequest, res: Response) => {
    try {
        // The bouncer (requireAuth) guarantees req.user exists by the time we get here
        const userId = req.user!.id; 
        
        // Strip out any fake userId the frontend might try to send
        const { userId: fakeId, ...recipeData } = req.body; 

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

        // Pass the verified ID from the token into the service
        const newRecipe = await recipeService.createRecipe(userId, recipeData);

        return res.status(201).json({ status: 'success', data: newRecipe });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
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
    const { id } = req.params; // Passed via URL

    if (typeof id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid recipe ID format'
      });
    }
    const { userId, ...recipeData } = req.body;

    const updatedRecipe = await recipeService.updateRecipe(id, userId, recipeData);

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

export const deleteRecipe = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ status: 'error', message: 'Recipe ID is required' });
        }

      if (typeof id !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid recipe ID format'
        });
      }

        await recipeService.deleteRecipe(id);

        return res.status(200).json({
            status: 'success',
            message: 'Recipe deleted successfully'
        });
    } catch (error: any) {
        console.error("Error deleting recipe:", error);
        
        // If Prisma can't find the record, it throws a specific error code
        if (error.code === 'P2025') {
            return res.status(404).json({ status: 'error', message: 'Recipe not found' });
        }

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

export const createComment = async (req: Request, res: Response) => {
      try {
        const { content, rating, userId } = req.body;
        const recipeId = req.params.id as string;

        const newComment = await prisma.comment.create({
            data: { 
                content, 
                rating: rating ? Number(rating) : null, 
                userId, 
                recipeId 
            },
            include: { 
                user: { 
                    select: { 
                        email: true,
                        firstName: true,
                        lastName: true,
                        alias: true
                    } 
                } 
            }
        });

        res.status(201).json({ status: 'success', data: newComment });
    } catch (error) {
        console.error("Comment Post Error:", error);
        res.status(500).json({ status: 'error', message: "Failed to post comment" });
    }
}

export const getAuthoredRecipes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const recipes = await recipeService.getAuthoredRecipes(userId);
        res.status(200).json({ status: 'success', data: recipes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch authored recipes' });
    }
};
