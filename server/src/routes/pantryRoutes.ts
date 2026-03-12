// src/routes/pantryRoutes.ts
import { Router } from 'express';
import { getIngredients, savePantry, getPantry, bulkAddToPantry } from '../controllers/pantryController.js';

const router = Router();

router.get('/ingredients', getIngredients);
router.get('/pantry', getPantry);
router.post('/pantry', savePantry);
router.post('/pantry/bulk-add', bulkAddToPantry);

export default router;
