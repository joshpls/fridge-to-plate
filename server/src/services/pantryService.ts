import { prisma } from '../config/db.js';

export const fetchAllIngredients = async () => {
  return await prisma.ingredient.findMany({ 
    orderBy: { name: 'asc' } 
  });
};

export const fetchUserPantry = async (userId: string) => {
  const entries = await prisma.pantryItem.findMany({
    where: { userId },
    include: { ingredient: true }
  });
  return entries.map(entry => entry.ingredient);
};

export const updateUserPantry = async (userId: string, ingredientIds: string[]) => {
  return await prisma.$transaction([
    prisma.pantryItem.deleteMany({ where: { userId } }),
    prisma.pantryItem.createMany({
      data: ingredientIds.map(id => ({
        ingredientId: id,
        userId: userId,
      })),
    })
  ]);
};
