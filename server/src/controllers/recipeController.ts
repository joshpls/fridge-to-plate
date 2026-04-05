import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

export const getMatches = async (req: Request, res: Response) => {
  try {
    let userId = (req as any).user?.id;
    let activeHouseholdId = (req as any).user?.activeHouseholdId;

    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            userId = decoded.id;
        } catch (e) {}
    }

    const { 
      categoryId, subcategoryId, search, tags, includeIngredients, 
      excludeIngredients, favoritesOnly, matchOnly, showStaples,
      sort, page, limit, scope // [NEW] Catch the scope variable
    } = req.query;
    
    const filters = {
      categoryId: categoryId as string,
      subcategoryId: subcategoryId as string,
      search: search as string,
      tags: tags as string,
      includeIngredients: includeIngredients as string,
      excludeIngredients: excludeIngredients as string,
      favoritesOnly: favoritesOnly as string,
      matchOnly: matchOnly as string,
      showStaples: showStaples as string,
      scope: scope as 'all' | 'household' | 'mine', // [NEW]
      sort: sort as 'asc' | 'desc',
    };
    
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12,
    };

    const matchData = await recipeService.getMatches(userId, activeHouseholdId, filters, pagination);
    
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
        const [categories, tags, units, ingredients, modifiers] = await Promise.all([
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
            prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
            prisma.modifier.findMany({ orderBy: { name: 'asc' } })
        ]);
        
        return sendSuccess(res, { categories, tags, units, ingredients, modifiers }, "Taxonomy retrieved");
    } catch (error) {
        return sendError(res, "Could not fetch taxonomy", 500, error);
    }
};

export const createRecipe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; 
        const activeHouseholdId = req.user!.activeHouseholdId; // [NEW]
        const { userId: fakeId, ...recipeData } = req.body; 

      if (!recipeData.name || !recipeData.categoryId || !recipeData.instructions) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
      }

      if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
        return res.status(400).json({ status: 'error', message: 'A recipe must have at least one ingredient.' });
      }

        // [UPDATED]
        const newRecipe = await recipeService.createRecipe(userId, activeHouseholdId, recipeData);

        return res.status(201).json({ status: 'success', data: newRecipe });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const recipeData = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Invalid recipe ID format' });
    }

    const existingRecipe = await prisma.recipe.findUnique({ 
        where: { id }, select: { imageUrl: true } 
    });

    const updatedRecipe = await recipeService.updateRecipe(id, userId, recipeData, userRole);

    if (existingRecipe?.imageUrl && existingRecipe.imageUrl !== recipeData.imageUrl) {
        await deleteLocalImage(existingRecipe.imageUrl);
    }

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
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'A valid Recipe ID string is required'
      });
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }, select: { imageUrl: true }
    });

    await recipeService.deleteRecipe(id, userId, userRole);

    if (existingRecipe?.imageUrl) {
      await deleteLocalImage(existingRecipe.imageUrl);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Recipe deleted successfully'
    });
  } catch (error: any) {
    if (error.message === "Unauthorized or Recipe not found.") {
      return res.status(403).json({ status: 'error', message: error.message });
    }

    console.error("Error deleting recipe:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Recipe not found' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRecipeDetail = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const userId = (req as any).user?.id || req.query.userId as string | undefined;
  const activeHouseholdId = (req as any).user?.activeHouseholdId;

  if (!slug) return res.status(400).json({ status: 'error', message: 'Missing slug' });

  try {
    const recipeDto = await recipeService.getRecipeBySlug(slug, userId, activeHouseholdId);
    if (!recipeDto) return res.status(404).json({ status: 'error', message: 'Recipe not found or private' });
    res.status(200).json({ status: 'success', data: recipeDto });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const handleToggleFavorite = async (req: AuthRequest, res: Response) => {
  const slug = req.params.slug as string;
  const userId = req.user!.id;
  const activeHouseholdId = req.user!.activeHouseholdId; // [NEW]

  if (!slug) return res.status(400).json({ status: 'error', message: 'Missing recipe slug' });

  try {
    const result = await recipeService.toggleRecipeFavorite(userId, activeHouseholdId, slug);
    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    const statusCode = error.message === 'Recipe not found' ? 404 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

export const getFavorites = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const activeHouseholdId = req.user!.activeHouseholdId;

  try {
    const favorites = await recipeService.getFavoriteRecipes(userId, activeHouseholdId);
    res.status(200).json({ status: 'success', data: favorites });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve favorites' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const { content, rating } = req.body;
        const userId = req.user!.id;
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
};

export const deleteUserComment = async (req: AuthRequest, res: Response) => {
    try {
        const commentId = req.params.commentId as string;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const comment = await prisma.comment.findUnique({ where: { id: commentId }});
        if (!comment || (comment.userId !== userId && userRole !== 'ADMIN')) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        res.status(200).json({ status: 'success', message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete comment' });
    }
};

export const getAuthoredRecipes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const activeHouseholdId = req.user!.activeHouseholdId;
        const recipes = await recipeService.getAuthoredRecipes(userId, activeHouseholdId);
        res.status(200).json({ status: 'success', data: recipes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch authored recipes' });
    }
};

const deleteLocalImage = async (imageUrl?: string | null) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
    try {
        const filename = path.basename(imageUrl);
        const filePath = path.join(process.cwd(), 'public/uploads', filename);
        await fs.unlink(filePath);
    } catch (err: any) {
        if (err.code !== 'ENOENT') console.error('Failed to delete old recipe image:', err);
    }
};
