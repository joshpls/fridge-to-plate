import { Router } from 'express';
import { getMatches, getFavorites, handleToggleFavorite, createRecipe, updateRecipe, getRecipeDetail, getCategories, getTags, getTaxonomy } from '../controllers/recipeController.js';

const router = Router();

router.get('/favorites', getFavorites);
router.get('/matches', getMatches);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/taxonomy', getTaxonomy);
router.post('/:slug/favorite', handleToggleFavorite);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.get('/:slug', getRecipeDetail);

export default router;
