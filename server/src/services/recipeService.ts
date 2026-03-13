import { prisma } from '../config/db.js';
import { mapRecipeToDto } from '../utils/helperFunctions.js';

export const getMatches = async (
  userId: string, 
  filters?: { categoryId?: string, search?: string, tags?: string },
  pagination?: { page: number, limit: number }
) => {
  const tagIds = filters?.tags ? filters.tags.split(',') : [];
  
  // Pagination Math
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 12;
  const skip = (page - 1) * limit;

  // Build the Where Clause once so it can be used for both findMany and count
  const whereClause: any = {
    AND: [
      filters?.categoryId && filters.categoryId !== 'all' ? { categoryId: filters.categoryId } : {},
      filters?.search ? { name: { contains: filters.search, mode: 'insensitive' } } : {},
      tagIds.length > 0 ? { tags: { some: { id: { in: tagIds } } } } : {}
    ]
  };

  // Run queries in parallel for maximum performance
  const [recipes, totalCount, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
      where: whereClause,
      skip, // Skip previous pages
      take: limit, // Only take X amount
      orderBy: { name: 'asc' }, // MUST have an orderBy to guarantee consistent pagination
      include: {
        ingredients: { include: { ingredient: true } },
        favorites: { where: { userId } },
        category: true,
        tags: true
      }
    }),
    prisma.recipe.count({ where: whereClause }), // Get total recipes matching these filters
    prisma.pantryItem.findMany({ where: { userId } })
  ]);

  const pantryIds = new Set(pantryEntries.map(p => p.ingredientId));
  
  const mappedRecipes = recipes.map(recipe => ({
    ...mapRecipeToDto(recipe, pantryIds),
    category: recipe.category?.name,
    tags: recipe.tags
  }));

  // Return an object containing the recipes AND the pagination metadata
  return {
    recipes: mappedRecipes,
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
    hasMore: skip + recipes.length < totalCount
  };
};

export const getRecipeBySlug = async (slug: string, userId: string) => {
  return await prisma.recipe.findUnique({
    where: { slug },
    include: {
      ingredients: { include: { ingredient: true } },
      favorites: { where: { userId } }
    }
  });
};

export const getFavoriteRecipes = async (userId: string) => {
  const [recipes, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
      where: { favorites: { some: { userId } } },
      include: {
        ingredients: { include: { ingredient: true } },
        favorites: { where: { userId } }
      }
    }),
    prisma.pantryItem.findMany({ where: { userId } })
  ]);

  const pantryIds = new Set(pantryEntries.map(p => p.ingredientId));
  return recipes.map(recipe => mapRecipeToDto(recipe, pantryIds));
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
