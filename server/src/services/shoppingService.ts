import { prisma } from '../config/db.js';

export const addItemsToList = async (userId: string, items: { ingredientId: string, amount: string }[]) => {
  return await prisma.shoppingItem.createMany({
    data: items.map(item => ({
      userId,
      ingredientId: item.ingredientId,
      amount: item.amount,
      bought: false
    }))
  });
};

export const getShoppingList = async (userId: string) => {
  return await prisma.shoppingItem.findMany({
    where: { userId, bought: false }, // Only show items not yet bought
    include: { ingredient: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const toggleBoughtStatus = async (itemId: string, bought: boolean) => {
  return await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.shoppingItem.update({
      where: { id: itemId },
      data: { bought },
      include: { ingredient: true }
    });

    if (bought) {
      await tx.pantryItem.upsert({
        where: {
          userId_ingredientId: {
            userId: updatedItem.userId,
            ingredientId: updatedItem.ingredientId,
          },
        },
        update: {
          updatedAt: new Date(), 
        },
        create: {
          userId: updatedItem.userId,
          ingredientId: updatedItem.ingredientId,
        },
      });
    }

    return updatedItem;
  });
};

export const clearShoppingList = async (userId: string) => {
  return await prisma.shoppingItem.deleteMany({
    where: { userId }
  });
};

export const buyAllItems = async (userId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all current items that aren't bought yet
    const items = await tx.shoppingItem.findMany({
      where: { userId, bought: false }
    });

    if (items.length === 0) return;

    // 2. Mark them all as bought
    await tx.shoppingItem.updateMany({
      where: { userId, bought: false },
      data: { bought: true }
    });

    // 3. Move them to pantry (using createMany with skipDuplicates for efficiency)
    await tx.pantryItem.createMany({
      data: items.map(item => ({
        userId: item.userId,
        ingredientId: item.ingredientId
      })),
      skipDuplicates: true // This acts like our upsert logic in bulk
    });

    return items;
  });
};
