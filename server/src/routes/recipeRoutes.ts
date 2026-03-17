import { Router } from 'express';
import { getMatches, getFavorites, handleToggleFavorite, createRecipe, updateRecipe, getRecipeDetail, getCategories, getTags, getTaxonomy, deleteRecipe} from '../controllers/recipeController.js';


// server/src/routes/recipeRoutes.ts
import express from 'express';
import * as recipeController from '../controllers/recipeController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { getRecipeBySlug } from '../services/recipeService.js';

const router = express.Router();

// PUBLIC ROUTES (No middleware needed)
router.get('/', createRecipe);
router.get('/taxonomy', getTaxonomy);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/favorites', getFavorites);
router.get('/matches', getMatches);
router.get('/taxonomy', getTaxonomy);

router.put('/:id', updateRecipe);
router.get('/:slug', getRecipeDetail);
router.post('/:slug/favorite', handleToggleFavorite);

// PROTECTED ROUTES (Requires Login)
// Notice how we inject `requireAuth` before the controller function
router.post('/', requireAuth, recipeController.createRecipe);

// ADMIN ONLY ROUTES
router.delete('/:id', requireAuth, requireAdmin, deleteRecipe);

export default router;
