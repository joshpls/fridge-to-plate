import { prisma } from '../config/db.js';

export const getMatches = async (userId: string) => {
  // 1. Fetch recipes and include the favorites for this specific user
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: { ingredient: true }
      },
      // Check if a favorite record exists for this user
      favorites: {
        where: { userId: userId }
      }
    }
  });

  // 2. Map the results to include a simple boolean 'isFavorite'
  const pantryEntries = await prisma.pantryItem.findMany({ where: { userId } });
  const pantryIds = new Set(pantryEntries.map(p => p.ingredientId));

  return recipes.map(recipe => {
    const matched = recipe.ingredients.filter(ri => pantryIds.has(ri.ingredientId));
    const matchPercentage = Math.round((matched.length / recipe.ingredients.length) * 100);

    return {
      id: recipe.id,
      name: recipe.name,
      slug: recipe.slug,
      matchPercentage,
      missingCount: recipe.ingredients.length - matched.length,
      // If the favorites array has an entry, it means this user liked it
      isFavorite: recipe.favorites.length > 0,
      // Include dietary flags for the frontend filters
      isVegan: recipe.isVegan,
      isGlutenFree: recipe.isGlutenFree,
    };
  });
};

export const getFavoriteRecipes = async (userId: string) => {
  // Fetch only recipes that have a record in the Favorite table for this user
  const recipes = await prisma.recipe.findMany({
    where: {
      favorites: {
        some: { userId }
      }
    },
    include: {
      ingredients: { include: { ingredient: true } },
      favorites: { where: { userId } }
    }
  });

  // Reuse your mapping logic to include matchPercentage and isFavorite: true
  // (You could extract the mapping logic to a private helper function to keep it DRY)
  return recipes.map(recipe => ({
    ...recipe,
    isFavorite: true // We already know these are favorited
  }));
};

export const toggleRecipeFavorite = async (userId: string, recipeSlug: string) => {
  // 1. Find the recipe ID by the slug
  const recipe = await prisma.recipe.findUnique({
    where: { slug: recipeSlug },
    select: { id: true }
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // 2. Check if the favorite already exists
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId: recipe.id,
      },
    },
  });

  // 3. Toggle: Delete if exists, Create if not
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