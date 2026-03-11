import { prisma } from '../config/db.js';
import { mapRecipeToDto } from '../utils/helperFunctions.js';

export const getMatches = async (userId: string) => {
  const [recipes, pantryEntries] = await Promise.all([
    prisma.recipe.findMany({
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
