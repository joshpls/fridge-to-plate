import { prisma } from '../config/db.js';
import { mapRecipeToDto, generateUniqueSlug } from '../utils/helperFunctions.js';

const userProfileSelect = {
    select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        alias: true
    }
};

const recipeIncludes = (userId: string) => ({
  author: userProfileSelect, // Changed from true
  category: true,
  subcategory: true,
  tags: true,
  favorites: { where: { userId } },
  ingredients: {
    include: {
      ingredient: true,
      unit: true 
    }
  },
  comments: {
    include: { 
        user: userProfileSelect // Changed from true
    },
    orderBy: { createdAt: 'desc' as const }
  }
});

const fallbackIncludes = {
    author: userProfileSelect, // <-- Crucial: Always fetch the author!
    category: true,
    subcategory: true,
    tags: true,
    ingredients: {
        include: {
            ingredient: true,
            unit: true 
        }
    },
    comments: {
        include: { user: userProfileSelect },
        orderBy: { createdAt: 'desc' as const }
    }
};

export const createRecipe = async (userId: string, data: any) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify Category exists
    const categoryExists = await tx.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!categoryExists) {
      throw new Error(`Category with ID ${data.categoryId} not found. Please refresh your cache.`);
    }

    // 2. Create the Recipe (No more user upsert needed here, auth middleware handles it!)
    return await tx.recipe.create({
      data: {
        name: data.name,
        slug: generateUniqueSlug(data.name),
        imageUrl: data.imageUrl || null,
        summary: data.summary || null,
        instructions: data.instructions,
        notes: data.notes || null,
        prepTime: Number(data.prepTime) || 0,
        cookTime: Number(data.cookTime) || 0,
        totalTime: (Number(data.prepTime) || 0) + (Number(data.cookTime) || 0),
        servings: Number(data.servings) || 1,
        nutrition: data.nutrition || {},
        
        author: { connect: { id: userId } },
        category: { connect: { id: data.categoryId } },
        ...(data.subcategoryId && { subcategory: { connect: { id: data.subcategoryId } } }),
        
        tags: { connect: data.tagIds?.map((id: string) => ({ id })) || [] },
        
        ingredients: {
          create: data.ingredients.map((ing: any) => ({
            amount: typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount,
            ingredient: { connect: { id: ing.ingredientId } },
            unit: { connect: { id: ing.unitId } }
          }))
        }
      }
    });
  });
};
export const updateRecipe = async (recipeId: string, userId: string, data: any, userRole: string) => {
  return await prisma.$transaction(async (tx) => {
    
    // Verify ownership
    const existingRecipe = await tx.recipe.findUnique({ where: { id: recipeId } });
    if (!existingRecipe || (existingRecipe.authorId !== userId && userRole !== 'ADMIN')) {
      throw new Error("Unauthorized or Recipe not found.");
    }

    // Delete existing ingredient mappings first
    await tx.recipeIngredient.deleteMany({
      where: { recipeId }
    });

    // Update the recipe with new data
    return await tx.recipe.update({
      where: { id: recipeId },
      data: {
        name: data.name,
        imageUrl: data.imageUrl || null,
        summary: data.summary || null,
        instructions: data.instructions,
        notes: data.notes || null,
        prepTime: Number(data.prepTime) || 0,
        cookTime: Number(data.cookTime) || 0,
        totalTime: (Number(data.prepTime) || 0) + (Number(data.cookTime) || 0),
        servings: Number(data.servings) || 1,
        nutrition: data.nutrition || {},
        
        category: { connect: { id: data.categoryId } },
        
        // Disconnect old subcategory if it was removed, or connect the new one
        subcategory: data.subcategoryId 
            ? { connect: { id: data.subcategoryId } }
            : { disconnect: true },

        // Set tags completely overwrites the old relations with the new array
        tags: {
          set: data.tagIds?.map((id: string) => ({ id })) || []
        },

        // Recreate the ingredients from scratch using the new list
        ingredients: {
          create: data.ingredients.map((ing: any) => ({
            amount: Number(ing.amount),
            ingredient: { connect: { id: ing.ingredientId } },
            unit: { connect: { id: ing.unitId } }
          }))
        }
      }
    });
  });
};

export const deleteRecipe = async (recipeId: string, userId: string, userRole: string) => {
    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { authorId: true }
    });

    // Must exist AND (must be the author OR must be an admin)
    if (!recipe || (recipe.authorId !== userId && userRole !== 'ADMIN')) {
        throw new Error("Unauthorized or Recipe not found.");
    }

    return await prisma.recipe.delete({
        where: { id: recipeId }
    });
};

export const getMatches = async (
  userId?: string, 
  filters?: { 
    categoryId?: string; 
    subcategoryId?: string;
    search?: string; 
    tags?: string;
    includeIngredients?: string; // comma-separated ingredient IDs
    excludeIngredients?: string; // comma-separated ingredient IDs
    favoritesOnly?: string;      // 'true' or 'false'
    sort?: 'asc' | 'desc';
  },
  pagination?: { page: number, limit: number }
) => {
  const tagIds = filters?.tags ? filters.tags.split(',') : [];
  const includeIngIds = filters?.includeIngredients ? filters.includeIngredients.split(',') : [];
  const excludeIngIds = filters?.excludeIngredients ? filters.excludeIngredients.split(',') : [];
  
  const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
  const take = pagination?.limit || 12;

  // Build the dynamic WHERE clause
  const whereClause: any = { AND: [] };

  if (filters?.categoryId) whereClause.AND.push({ categoryId: filters.categoryId });
  if (filters?.subcategoryId) whereClause.AND.push({ subcategoryId: filters.subcategoryId });
  if (filters?.search) whereClause.AND.push({ name: { contains: filters.search, mode: 'insensitive' } });
  if (filters?.favoritesOnly === 'true') whereClause.AND.push({ favorites: { some: { userId } } });

  // 1. Tags (AND logic - must have ALL selected tags)
  if (tagIds.length > 0) {
    tagIds.forEach(tagId => {
      whereClause.AND.push({ tags: { some: { id: tagId } } });
    });
  }

  // 2. Include Ingredients (must have ALL these ingredients)
  if (includeIngIds.length > 0) {
    includeIngIds.forEach(ingId => {
      whereClause.AND.push({ ingredients: { some: { ingredientId: ingId } } });
    });
  }

  // 3. Exclude Ingredients (must NOT have ANY of these ingredients)
  if (excludeIngIds.length > 0) {
    whereClause.AND.push({
      NOT: {
        ingredients: { some: { ingredientId: { in: excludeIngIds } } }
      }
    });
  }

  // If no filters were applied, remove the empty AND array to prevent Prisma errors
  const finalWhere = whereClause.AND.length > 0 ? whereClause : {};

  const [recipes, totalCount, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
        where: finalWhere,
        include: userId ? recipeIncludes(userId) : fallbackIncludes, 
        skip,
        take,
        orderBy: { name: filters?.sort === 'desc' ? 'desc' : 'asc' }
    }),
    prisma.recipe.count({
      where: finalWhere
    }),
    userId ? prisma.pantryItem.findMany({ where: { userId } }) : Promise.resolve([])
  ]);

  const pantryIds = new Set<string>(pantryEntries.map((p: any) => p.ingredientId));
  
  return {
    recipes: recipes.map((recipe: any) => mapRecipeToDto(recipe, pantryIds)),
    totalCount,
    hasMore: skip + recipes.length < totalCount
  };
};

export const getRecipeBySlug = async (slug: string, userId?: string) => {
  // Fetch both in parallel for better performance
  const [recipe, pantryEntries] = await Promise.all([
    prisma.recipe.findUnique({
      where: { slug },
      include: {
        ingredients: { 
          include: { 
            ingredient: true,
            unit: true // CRITICAL: Required for ri.unit.name in mapper
          } 
        },
        category: true,
        subcategory: true,
        tags: true,
        author: userProfileSelect,
        comments: {
          include: { user: userProfileSelect },
          orderBy: { createdAt: 'desc' }
        },
        favorites: { where: { userId } }
      }
    }),
    userId ? prisma.pantryItem.findMany({ where: { userId } }) : Promise.resolve([])
  ]);

  if (!recipe) return null;

  // Create the Set for the mapper
  const pantryIds = new Set(pantryEntries.map(p => p.ingredientId));

  // Return the sanitized DTO directly to the controller
  return mapRecipeToDto(recipe, pantryIds);
};

export const getFavoriteRecipes = async (userId: string) => {
  const [recipes, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
      where: { favorites: { some: { userId } } },
      include: recipeIncludes(userId)
    }),
    prisma.pantryItem.findMany({ where: { userId } })
  ]);

  const pantryIds = new Set<string>(pantryEntries.map((p: any) => p.ingredientId));
  return recipes.map((recipe: any) => mapRecipeToDto(recipe, pantryIds));
};

export const toggleRecipeFavorite = async (userId: string, recipeSlug: string) => {
  // Find the recipe ID by the slug
  const recipe = await prisma.recipe.findUnique({
    where: { slug: recipeSlug },
    select: { id: true }
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Check if the favorite already exists
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId: recipe.id,
      },
    },
  });

  // Toggle: Delete if exists, Create if not
  if (existingFavorite) {
    await prisma.favorite.delete({
      where: {
        userId_recipeId: {
          userId,
          recipeId: recipe.id,
        },
      },
    });
    return { favorited: false };
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        recipeId: recipe.id,
      },
    });
    return { favorited: true };
  }
};

export const getAuthoredRecipes = async (userId: string) => {
  const [recipes, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
      where: { authorId: userId },
      include: recipeIncludes(userId),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.pantryItem.findMany({ where: { userId } })
  ]);

  const pantryIds = new Set<string>(pantryEntries.map((p: any) => p.ingredientId));
  return recipes.map((recipe: any) => mapRecipeToDto(recipe, pantryIds));
};
