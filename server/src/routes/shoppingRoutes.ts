// server/src/routes/shoppingRoutes.ts
import { Router } from 'express';
import * as shoppingController from '../controllers/shoppingController.js';

const router = Router();
router.post('/', shoppingController.handleAddToList);
router.get('/:userId', shoppingController.getLimit);
router.patch('/:itemId', shoppingController.toggleStatus);
router.delete('/:userId', shoppingController.handleClearList);
router.post('/buy-all/:userId', shoppingController.handleBuyAll);

export default router;
