// server/src/routes/pantryRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPantry, savePantry, bulkAddToPantry, bulkRemoveFromPantry } from '../controllers/pantryController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getPantry);
router.post('/', savePantry);
router.post('/bulk', bulkAddToPantry);
router.delete('/bulk-remove', bulkRemoveFromPantry);

export default router;
