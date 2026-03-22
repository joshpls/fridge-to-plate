// server/src/routes/adminRoutes.ts
import express from 'express';
import { getAllUsers, getSystemStats, toggleUserRole, createCategory, createSubcategory, updateCategory, deleteCategory, updateSubcategory, deleteSubcategory, createIngredient, updateIngredient, deleteIngredient, getAllRecipes, deleteRecipe, createTag, deleteTag, createUnit, deleteUnit, deleteComment, updateUser, deleteUser, getAllComments } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply the "Double Bouncer" to every route in this file
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard Stats
router.get('/stats', getSystemStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', toggleUserRole);

// Recipe Management
router.get('/recipes', getAllRecipes);
router.delete('/recipes/:id', deleteRecipe);

// Categories & Subcategories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/categories/:categoryId/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// Ingredient Management
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);

// Tag Management
router.post('/tags', createTag);
router.delete('/tags/:id', deleteTag);

// Unit Management
router.post('/units', createUnit);
router.delete('/units/:id', deleteUnit);

// Delete Comment
router.get('/comments', getAllComments);
router.delete('/comments/:id', deleteComment);

export default router;
