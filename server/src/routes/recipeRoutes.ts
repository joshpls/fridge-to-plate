import { Router } from 'express';
import { getMatches, getFavorites, handleToggleFavorite } from '../controllers/recipeController.js';

const router = Router();

router.get('/favorites', getFavorites);
router.get('/matches', getMatches);
router.post('/:slug/favorite', handleToggleFavorite);

export default router;
