// server/src/routes/pantryRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPantry, savePantry, bulkAddToPantry } from '../controllers/pantryController.js';

const router = express.Router();

router.use(requireAuth); // Apply to all routes in this file

router.get('/', getPantry);
router.post('/', savePantry); // Replaces the whole pantry
router.post('/bulk', bulkAddToPantry); // Appends to the pantry

export default router;
