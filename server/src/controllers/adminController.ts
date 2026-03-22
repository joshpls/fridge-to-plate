// server/src/controllers/adminController.ts
import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middleware/authMiddleware.js'; // Use .js extension
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const getSystemStats = async (req: AuthRequest, res: Response) => {
    try {
        const [userCount, recipeCount, ingredientCount] = await Promise.all([
            prisma.user.count(),
            prisma.recipe.count(),
            prisma.ingredient.count()
        ]);

        return sendSuccess(res, { 
            users: userCount, 
            recipes: recipeCount, 
            ingredients: ingredientCount 
        }, "Stats fetched successfully");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, alias: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        return sendSuccess(res, users, "Users fetched successfully");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

// --- USER CRUD ---
export const toggleUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const targetUserId = req.params.id as string;
        const requestingUserId = req.user?.id;

        if (targetUserId === requestingUserId) {
            return sendError(res, "Safety catch: You cannot change your own role.", 400);
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole }
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return sendSuccess(res, userWithoutPassword, `User role updated to ${newRole}`);
    } catch (error) {
        return sendError(res, "Failed to update role", 500, error);
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    const userId = req.params.id as string;
    try {
        const { firstName, lastName, alias, email } = req.body;

        // Update the user and specifically select the fields we want to return
        // (This ensures we never accidentally send the password hash back)
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                alias,
                email: email?.toLowerCase() // Keep emails standardized
            },
            select: { id: true, email: true, firstName: true, lastName: true, alias: true, role: true, createdAt: true }
        });

        return sendSuccess(res, updatedUser, "User updated successfully");
    } catch (error: any) {
        console.error("Error updating user:", error);
        
        // P2002 is Prisma's error code for a Unique Constraint violation
        if (error.code === 'P2002') {
            return sendError(res, "That email is already in use by another account.", 400);
        }
        return sendError(res, "Failed to update user", 500, error);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    const targetUserId = req.params.id as string;
    const requestingUserId = req.user?.id as string;

    // Server-side safety catch
    if (targetUserId === requestingUserId) {
        return sendError(res, "Safety catch: You cannot delete your own account.", 400);
    }

    try {
        await prisma.user.delete({
            where: { id: targetUserId }
        });

        return sendSuccess(res, null, "User deleted successfully");
    } catch (error: any) {
        console.error("Error deleting user:", error);
        
        // P2003 is Prisma's error code for a Foreign Key constraint failure
        if (error.code === 'P2003') {
            return sendError(res, "Cannot delete user because they have authored recipes or posted comments. Delete their content first.", 400);
        }
        return sendError(res, "Failed to delete user", 500, error);
    }
};


// --- CATEGORY CRUD ---
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return sendError(res, "Category name is required", 400);

        const category = await prisma.category.create({
            data: { name }
        });

        return sendSuccess(res, category, "Category created successfully", 201);
    } catch (error) {
        return sendError(res, "Failed to create category", 500, error);
    }
};

export const createSubcategory = async (req: AuthRequest, res: Response) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;

        if (typeof categoryId !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid Category ID format'
            });
        }

        if (!name || !categoryId) {
            return sendError(res, "Name and Category ID are required", 400);
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name,
                categoryId
            }
        });

        return sendSuccess(res, subcategory, "Subcategory created successfully", 201);
    } catch (error) {
        return sendError(res, "Failed to create subcategory", 500, error);
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const { name } = req.body;
        const category = await prisma.category.update({
            where: { id: id },
            data: { name }
        });
        return sendSuccess(res, category, "Category updated");
    } catch (error) {
        return sendError(res, "Failed to update category", 500, error);
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        await prisma.category.delete({ where: { id } });
        return sendSuccess(res, null, "Category deleted");
    } catch (error: any) {
        if (error.code === 'P2003') return sendError(res, "Cannot delete: Category is in use by recipes.", 400);
        return sendError(res, "Failed to delete category", 500, error);
    }
};

// --- SUBCATEGORY CRUD ---
export const updateSubcategory = async (req: Request, res: Response) => {
        const id = req.params.id as string;

    try {
        const { name } = req.body;
        const subcategory = await prisma.subcategory.update({
            where: { id: id },
            data: { name }
        });
        return sendSuccess(res, subcategory, "Subcategory updated");
    } catch (error) {
        return sendError(res, "Failed to update subcategory", 500, error);
    }
};

export const deleteSubcategory = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        await prisma.subcategory.delete({ where: { id: id } });
        return sendSuccess(res, null, "Subcategory deleted");
    } catch (error: any) {
        if (error.code === 'P2003') return sendError(res, "Cannot delete: Subcategory is in use.", 400);
        return sendError(res, "Failed to delete subcategory", 500, error);
    }
};

// --- INGREDIENT CRUD ---
export const createIngredient = async (req: AuthRequest, res: Response) => {
    try {
        const { name, isStaple } = req.body;
        const ingredient = await prisma.ingredient.create({
            data: { 
                name, 
                isStaple: isStaple || false 
            }
        });

        return sendSuccess(res, ingredient, "Ingredient created");
    } catch (error) {
        // This catch block handles the Prisma error if creation fails
        return sendError(res, "Failed to create ingredient", 500, error);
    }
};

export const updateIngredient = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const { name, isStaple } = req.body;
        
        const ingredient = await prisma.ingredient.update({
            where: { id: id },
            data: { 
                name,
                ...(isStaple !== undefined && { isStaple: Boolean(isStaple) })
            }
        });
        return sendSuccess(res, ingredient, "Ingredient updated");
    } catch (error) {
        return sendError(res, "Failed to update ingredient", 500, error);
    }
};

export const deleteIngredient = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        await prisma.ingredient.delete({ where: { id: id } });
        return sendSuccess(res, null, "Ingredient deleted");
    } catch (error: any) {
        if (error.code === 'P2003') return sendError(res, "Cannot delete: Ingredient is used in recipes or pantries.", 400);
        return sendError(res, "Failed to delete ingredient", 500, error);
    }
};

export const getAllRecipes = async (req: Request, res: Response) => {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                author: { select: { email: true } },
                category: { select: { name: true } },
                subcategory: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ status: 'success', data: recipes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch recipes' });
    }
}

export const deleteRecipe = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        await prisma.recipe.delete({
            where: { id: id }
        });
        res.status(200).json({ status: 'success', message: 'Recipe deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete recipe' });
    }
};

// --- TAGS ---

export const createTag = async (req: Request, res: Response) => {
    try {
        const { name, code } = req.body;
        
        // Ensure the code is uppercase
        const newTag = await prisma.tag.create({
            data: { 
                name, 
                code: code.toUpperCase().trim() 
            }
        });

        res.status(201).json({ status: 'success', data: newTag });
    } catch (error: any) {
        console.error("Failed to create tag:", error);
        // Handle potential unique constraint errors (e.g., code already exists)
        if (error.code === 'P2002') {
            return res.status(400).json({ status: 'error', message: 'A tag with this code or name already exists.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create tag' });
    }
};

export const deleteTag = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.tag.delete({
            where: { id }
        });

        res.status(200).json({ status: 'success', message: 'Tag deleted successfully' });
    } catch (error) {
        console.error("Failed to delete tag:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete tag. It may be in use by existing recipes.' });
    }
};

// --- UNITS ---

export const createUnit = async (req: Request, res: Response) => {
    try {
        const { name, abbreviation } = req.body;

        const newUnit = await prisma.unit.create({
            data: { 
                name, 
                abbreviation: abbreviation.toLowerCase().trim() 
            }
        });

        res.status(201).json({ status: 'success', data: newUnit });
    } catch (error: any) {
        console.error("Failed to create unit:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ status: 'error', message: 'A unit with this abbreviation or name already exists.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create unit' });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.unit.delete({
            where: { id }
        });

        res.status(200).json({ status: 'success', message: 'Unit deleted successfully' });
    } catch (error) {
        console.error("Failed to delete unit:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete unit. It may be attached to existing ingredients.' });
    }
};

// -- COMMENTS --
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.comment.delete({ where: { id } });
        res.status(200).json({ status: 'success', message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ status: 'error', message: "Failed to delete comment" });
    }
};
