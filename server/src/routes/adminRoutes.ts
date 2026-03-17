// server/src/routes/adminRoutes.ts
import express from 'express';
import { getAllUsers, getSystemStats, toggleUserRole, createCategory, createSubcategory, updateCategory, deleteCategory, updateSubcategory, deleteSubcategory, updateIngredient, deleteIngredient } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { createIngredient } from '../controllers/recipeController.js';

const router = express.Router();

// Apply the "Double Bouncer" to every route in this file
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard Stats
router.get('/stats', getSystemStats);

// User Management
router.get('/users', getAllUsers);

// Categories & Subcategories
router.post('/categories', requireAuth, requireAdmin, createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/categories/:categoryId/subcategories', requireAuth, requireAdmin, createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// Ingredients
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);

router.patch('/users/:id/role', requireAuth, requireAdmin, toggleUserRole);

export default router;
