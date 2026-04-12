// server/src/services/pantryService.ts
import { prisma } from '../config/db.js';

export const fetchHouseholdPantry = async (householdId: string) => {
    const [pantryItems, staples] = await Promise.all([
        prisma.pantryItem.findMany({
            where: { householdId },
            include: {
                ingredient: true,
                unit: true,
                addedBy: { select: { alias: true, firstName: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.householdStaple.findMany({
            where: { householdId },
            select: { ingredientId: true }
        })
    ]);

    return {
        items: pantryItems,
        personalStapleIds: staples.map(s => s.ingredientId)
    };
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

export const togglePersonalStaple = async (householdId: string, ingredientId: string) => {
    const existing = await prisma.householdStaple.findUnique({
        where: {
            householdId_ingredientId: { householdId, ingredientId }
        }
    });

    if (existing) {
        await prisma.householdStaple.delete({
            where: { householdId_ingredientId: { householdId, ingredientId } }
        });
        return { isStaple: false };
    } else {
        await prisma.householdStaple.create({
            data: { householdId, ingredientId }
        });
        return { isStaple: true };
    }
};