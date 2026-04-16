import type { Response } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import * as recipeService from '../services/recipeService.js';
import jwt from 'jsonwebtoken'; // <-- Don't forget to import this!

export const getDiscoveryBootstrap = async (req: AuthRequest, res: Response) => {
    try {
        let userId = req.user?.id;
        let activeHouseholdId = (req as any).user?.activeHouseholdId;

        if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                userId = decoded.id;
                
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { activeHouseholdId: true }
                });
                
                if (user) {
                    activeHouseholdId = user.activeHouseholdId;
                }
            } catch (e) {
                // If token is invalid/expired, silently ignore and treat as a guest
            }
        }

        const [
            categories, tags, units, ingredients, modifiers,
            ingredientCategories, substitutionGroups, 
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
            prisma.ingredientCategory.findMany({ orderBy: { order: 'asc' } }),
            prisma.substitutionGroup.findMany({ orderBy: { name: 'asc' } }),

            // --- RECIPES ---
            recipeService.getMatches(
                userId,
                activeHouseholdId,
                {}, 
                { page: 1, limit: 12 }
            )
        ]);

        // Assemble the DTO
        const discoveryDTO = {
            taxonomy: { 
                categories, tags, units, ingredients, modifiers,
                ingredientCategories, substitutionGroups
            },
            recipes: matchData.recipes,
            totalRecipes: matchData.totalCount
        };

        return sendSuccess(res, discoveryDTO, "Discovery bootstrap loaded");
    } catch (error) {
        console.error("Bootstrap Error:", error);
        return sendError(res, "Failed to load discovery data", 500);
    }
};
