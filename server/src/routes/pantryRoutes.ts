// src/routes/pantryRoutes.ts
import { Router } from 'express';
import { getIngredients, savePantry, getPantry } from '../controllers/pantryController.js';

const router = Router();

router.get('/ingredients', getIngredients);
router.get('/pantry', getPantry);
router.post('/pantry', savePantry);

export default router;
