import { Router } from 'express';
import { getMatches, getFavorites, handleToggleFavorite, getRecipeDetail, getCategories, getTags } from '../controllers/recipeController.js';

const router = Router();

router.get('/favorites', getFavorites);
router.get('/matches', getMatches);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.post('/:slug/favorite', handleToggleFavorite);
router.get('/:slug', getRecipeDetail);

export default router;
