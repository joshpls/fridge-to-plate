import { prisma } from '../config/db.js';

export const fetchAllIngredients = async () => {
  return await prisma.ingredient.findMany({ 
    orderBy: { name: 'asc' } 
  });
};

export const fetchHouseholdPantry = async (householdId: string) => {
  const entries = await prisma.pantryItem.findMany({
    where: { householdId },
    include: { 
      ingredient: true,
      addedBy: { select: { firstName: true, alias: true } }
    }
  });
  
  return entries.map(entry => ({
      ...entry.ingredient,
      addedBy: entry.addedBy?.alias || entry.addedBy?.firstName || 'Unknown'
  }));
};

export const updateHouseholdPantry = async (householdId: string, ingredientIds: string[], addedById: string) => {
  return await prisma.$transaction([
    prisma.pantryItem.deleteMany({ where: { householdId } }),
    prisma.pantryItem.createMany({
      data: ingredientIds.map(id => ({
        ingredientId: id,
        householdId: householdId,
        addedById: addedById,
      })),
    })
  ]);
};

export const appendToHouseholdPantry = async (householdId: string, ingredientIds: string[], addedById: string) => {
  return await prisma.pantryItem.createMany({
    data: ingredientIds.map(id => ({
      ingredientId: id,
      householdId: householdId,
      addedById: addedById,
    })),
    skipDuplicates: true,
  });
};
