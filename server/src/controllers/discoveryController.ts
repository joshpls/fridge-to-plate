// server/src/controllers/discoveryController.ts
import type { Response } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import * as recipeService from '../services/recipeService.js';

export const getDiscoveryBootstrap = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const activeHouseholdId = req.user?.activeHouseholdId;

        const [
            categories, tags, units, ingredients, modifiers,
            matchData
        ] = await Promise.all([
            // --- TAXONOMY ---
            prisma.category.findMany({
                orderBy: { name: 'asc' },
                include: { subcategories: { orderBy: { name: 'asc' } } }
            }),
            prisma.tag.findMany({ orderBy: { name: 'asc' } }),
            prisma.unit.findMany({ orderBy: { name: 'asc' } }),
            prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
            prisma.modifier.findMany({ orderBy: { name: 'asc' } }),

            // --- RECIPES ---
            recipeService.getMatches(
                userId,
                activeHouseholdId,
                {}, // Default filters (sorts by match % automatically if userId exists)
                { page: 1, limit: 12 }
            )
        ]);

        // Assemble the DTO
        const discoveryDTO = {
            taxonomy: { categories, tags, units, ingredients, modifiers },
            recipes: matchData.recipes,
            totalRecipes: matchData.totalCount
        };

        return sendSuccess(res, discoveryDTO, "Discovery bootstrap loaded");
    } catch (error) {
        console.error("Bootstrap Error:", error);
        return sendError(res, "Failed to load discovery data", 500);
    }
};
