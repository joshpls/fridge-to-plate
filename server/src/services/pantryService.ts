// server/src/services/pantryService.ts
import { prisma } from '../config/db.js';

export const fetchHouseholdPantry = async (householdId: string) => {
    // Just fetch and return the pantry items
    const pantryItems = await prisma.pantryItem.findMany({
        where: { householdId },
        include: {
            ingredient: true,
            unit: true,
            addedBy: { select: { alias: true, firstName: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return pantryItems;
};

export const updateHouseholdPantry = async (householdId: string, items: any[], userId: string) => {
    return await prisma.$transaction(async (tx) => {
        await tx.pantryItem.deleteMany({
            where: { householdId }
        });

        if (items.length === 0) return true;

        await tx.pantryItem.createMany({
            data: items.map(item => ({
                householdId,
                ingredientId: item.ingredientId,
                addedById: userId,
                quantity: item.quantity ? parseFloat(item.quantity) : null,
                unitId: item.unitId || null,
                expiresAt: item.expiresAt ? new Date(item.expiresAt) : null
            })),
            skipDuplicates: true
        });

        return true;
    });
};

export const appendToHouseholdPantry = async (householdId: string, items: any[], userId: string) => {
    if (items.length === 0) return true;

    await prisma.pantryItem.createMany({
        data: items.map(item => ({
            householdId,
            ingredientId: item.ingredientId,
            addedById: userId,
            quantity: item.quantity ? parseFloat(item.quantity) : null,
            unitId: item.unitId || null,
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null
        })),
        skipDuplicates: true
    });

    return true;
};

export const removeMultipleFromHouseholdPantry = async (householdId: string, ingredientIds: string[]) => {
    await prisma.pantryItem.deleteMany({
        where: {
            householdId: householdId,
            ingredientId: { in: ingredientIds }
        }
    });
};
