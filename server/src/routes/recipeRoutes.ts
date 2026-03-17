import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { getMatches, getFavorites, handleToggleFavorite, createRecipe, updateRecipe, getRecipeDetail, getCategories, getTags, getTaxonomy, deleteRecipe, createComment, getAuthoredRecipes} from '../controllers/recipeController.js';
import { prisma } from '../config/db.js';


const router = express.Router();

// PUBLIC ROUTES (No middleware needed)
router.get('/', createRecipe);
router.get('/taxonomy', getTaxonomy);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/favorites', getFavorites);
router.get('/matches', getMatches);
router.get('/taxonomy', getTaxonomy);
router.get('/authored', requireAuth, getAuthoredRecipes);

router.put('/:id', updateRecipe);
router.get('/:slug', getRecipeDetail);
router.post('/:slug/favorite', handleToggleFavorite);

// PROTECTED ROUTES (Requires Login)
router.post('/', requireAuth, createRecipe);

router.post('/:id/comments', requireAuth, createComment);

// ADMIN ONLY ROUTES
router.delete('/:id', requireAuth, requireAdmin, deleteRecipe);

export default router;
