import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { getMatches, getFavorites, handleToggleFavorite, createRecipe, updateRecipe, getRecipeDetail, getCategories, getTags, getTaxonomy, deleteRecipe, createComment, getAuthoredRecipes, deleteUserComment} from '../controllers/recipeController.js';

const router = express.Router();

// STATIC PUBLIC ROUTES (No middleware needed)
router.get('/taxonomy', getTaxonomy);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/matches', getMatches);

// PROTECTED ROUTES (Requires Login)
router.get('/favorites', requireAuth, getFavorites);
router.get('/authored', requireAuth, getAuthoredRecipes);

// PARAMETERIZED ROUTES
router.get('/:slug', getRecipeDetail);

// ACTION ROUTES
router.post('/', requireAuth, createRecipe);
router.post('/:slug/favorite', requireAuth, handleToggleFavorite);
router.post('/:id/comments', requireAuth, createComment);
router.delete('/comments/:commentId', requireAuth, deleteUserComment);
router.put('/:id', requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);

export default router;
