// server/src/routes/pantryRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPantry, savePantry, bulkAddToPantry, togglePersonalStaple } from '../controllers/pantryController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getPantry);
router.post('/', savePantry);
router.post('/bulk', bulkAddToPantry);
router.post('/:ingredientId/staple', togglePersonalStaple);

export default router;
