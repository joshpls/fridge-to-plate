import { prisma } from '../config/db.js';
import { mapRecipeToDto, generateUniqueSlug } from '../utils/helperFunctions.js';

const userProfileSelect = {
    select: { id: true, email: true, firstName: true, lastName: true, alias: true }
};

const recipeIncludes = (userId: string) => ({
  author: userProfileSelect,
  category: true,
  subcategory: true,
  tags: true,
  favorites: { where: { userId } },
  ingredients: {
    orderBy: { order: 'asc' as const },
    include: { ingredient: true, unit: true, modifier: true }
  },
  comments: {
    include: { user: userProfileSelect },
    orderBy: { createdAt: 'desc' as const }
  }
});

const fallbackIncludes = {
    author: userProfileSelect,
    category: true,
    subcategory: true,
    tags: true,
    ingredients: {
        orderBy: { order: 'asc' as const },
        include: { ingredient: true, unit: true, modifier: true }
    },
    comments: {
        include: { user: userProfileSelect },
        orderBy: { createdAt: 'desc' as const }
    }
};

const getUserHouseholdContext = async (activeHouseholdId?: string) => {
    if (!activeHouseholdId) {
        return { pantryIds: new Set<string>(), pantrySubGroups: new Set<string>(), householdStapleIds: new Set<string>() };
    }

    const [pantryEntries, stapleEntries] = await Promise.all([
        prisma.pantryItem.findMany({ 
            where: { householdId: activeHouseholdId },
            include: { ingredient: { select: { subGroupId: true } } }
        }),
        prisma.householdStaple.findMany({ 
            where: { householdId: activeHouseholdId } 
        })
    ]);

    const pantryIds = new Set<string>(pantryEntries.map(p => p.ingredientId));
    // Extract non-null subGroupIds
    const pantrySubGroups = new Set<string>(pantryEntries.map(p => p.ingredient.subGroupId).filter((id): id is string => id !== null));
    const householdStapleIds = new Set<string>(stapleEntries.map(s => s.ingredientId));

    return { pantryIds, pantrySubGroups, householdStapleIds };
};

export const createRecipe = async (userId: string, activeHouseholdId: string, data: any) => {
    return await prisma.$transaction(async (tx) => {
        const categoryExists = await tx.category.findUnique({ where: { id: data.categoryId } });
        if (!categoryExists) throw new Error(`Category not found.`);
    
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
            sourceName: data.sourceName || null,
            sourceUrl: data.sourceUrl || null,
            visibility: data.visibility || 'PRIVATE',
            household: activeHouseholdId ? { connect: { id: activeHouseholdId } } : undefined,
            author: { connect: { id: userId } },
            category: { connect: { id: data.categoryId } },
            ...(data.subcategoryId && { subcategory: { connect: { id: data.subcategoryId } } }),
            tags: { connect: data.tagIds?.map((id: string) => ({ id })) || [] },
            ingredients: {
              create: data.ingredients.map((ing: any, index: number) => ({
                amount: typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount,
                order: index,
                sectionName: ing.sectionName,
                ingredient: { connect: { id: ing.ingredientId } },
                unit: { connect: { id: ing.unitId } },
                ...(ing.modifierId ? { modifier: { connect: { id: ing.modifierId } } } : {})
              }))
            }
          }
        });
      });
};

export const updateRecipe = async (recipeId: string, userId: string, data: any, userRole: string) => {
    return await prisma.$transaction(async (tx) => {
        const existingRecipe = await tx.recipe.findUnique({ where: { id: recipeId } });
        if (!existingRecipe || (existingRecipe.authorId !== userId && userRole !== 'ADMIN')) {
          throw new Error("Unauthorized or Recipe not found.");
        }
    
        await tx.recipeIngredient.deleteMany({ where: { recipeId } });
    
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
            sourceName: data.sourceName || null,
            sourceUrl: data.sourceUrl || null,
            visibility: data.visibility || existingRecipe.visibility,
            category: { connect: { id: data.categoryId } },
            subcategory: data.subcategoryId ? { connect: { id: data.subcategoryId } } : { disconnect: true },
            tags: { set: data.tagIds?.map((id: string) => ({ id })) || [] },
            
            ingredients: {
              create: data.ingredients.map((ing: any, index: number) => ({
                amount: Number(ing.amount),
                order: index,
                sectionName: ing.sectionName,
                ingredient: { connect: { id: ing.ingredientId } },
                unit: { connect: { id: ing.unitId } },
                ...(ing.modifierId ? { modifier: { connect: { id: ing.modifierId } } } : {})
              }))
            }
          }
        });
      });
};

export const deleteRecipe = async (recipeId: string, userId: string, userRole: string) => {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { authorId: true } });
    if (!recipe || (recipe.authorId !== userId && userRole !== 'ADMIN')) throw new Error("Unauthorized");
    return await prisma.recipe.delete({ where: { id: recipeId } });
};

export const getMatches = async (
  userId?: string,
  activeHouseholdId?: string, 
  filters?: { 
    categoryId?: string; subcategoryId?: string; search?: string; tags?: string;
    includeIngredients?: string; excludeIngredients?: string; 
    favoritesOnly?: string; matchOnly?: string; showStaples?: string; allowSubstitutions?: string;
    scope?: 'all' | 'household' | 'mine';
    sort?: 'asc' | 'desc';
  },
  pagination?: { page: number, limit: number }
) => {
  const tagIds = filters?.tags ? filters.tags.split(',') : [];
  const includeIngIds = filters?.includeIngredients ? filters.includeIngredients.split(',') : [];
  const excludeIngIds = filters?.excludeIngredients ? filters.excludeIngredients.split(',') : [];
  
  const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
  const take = pagination?.limit || 12;

  const whereClause: any = { AND: [] };

  if (userId) {
      if (filters?.scope === 'mine') {
          whereClause.AND.push({ authorId: userId });
      } else if (filters?.scope === 'household' && activeHouseholdId) {
          whereClause.AND.push({
              householdId: activeHouseholdId,
              visibility: { in: ['HOUSEHOLD', 'PUBLIC'] }
          });
      } else {
          whereClause.AND.push({
              OR: [
                  { visibility: 'PUBLIC' },
                  { visibility: 'HOUSEHOLD', householdId: activeHouseholdId },
                  { authorId: userId }
              ]
          });
      }
  } else {
      whereClause.AND.push({ visibility: 'PUBLIC' });
  }

  if (filters?.categoryId) whereClause.AND.push({ categoryId: filters.categoryId });
  if (filters?.subcategoryId) whereClause.AND.push({ subcategoryId: filters.subcategoryId });
  if (filters?.search) whereClause.AND.push({ name: { contains: filters.search, mode: 'insensitive' } });
  if (filters?.favoritesOnly === 'true') whereClause.AND.push({ favorites: { some: { userId } } });

  if (tagIds.length > 0) tagIds.forEach(tagId => whereClause.AND.push({ tags: { some: { id: tagId } } }));
  if (includeIngIds.length > 0) includeIngIds.forEach(ingId => whereClause.AND.push({ ingredients: { some: { ingredientId: ingId } } }));
  if (excludeIngIds.length > 0) whereClause.AND.push({ NOT: { ingredients: { some: { ingredientId: { in: excludeIngIds } } } } });

  const finalWhere = whereClause.AND.length > 0 ? whereClause : {};

  const [allRecipes, context] = await Promise.all([
    prisma.recipe.findMany({
        where: finalWhere,
        include: userId ? recipeIncludes(userId) : fallbackIncludes,
    }),
    getUserHouseholdContext(activeHouseholdId)
  ]);

  const showStaplesBool = filters?.showStaples === 'true';
  const allowSubsBool = filters?.allowSubstitutions !== 'false';

  let mappedRecipes = allRecipes.map((recipe: any) =>
    mapRecipeToDto(recipe, context.pantryIds, context.pantrySubGroups, context.householdStapleIds, showStaplesBool, allowSubsBool)
  );

  if (filters?.matchOnly === 'true') mappedRecipes = mappedRecipes.filter((r: any) => r.matchPercentage === 100);

  const sortDirection = filters?.sort === 'desc' ? -1 : 1;
  mappedRecipes.sort((a: any, b: any) => {
      if (userId && b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase()) * sortDirection;
  });

  const totalCount = mappedRecipes.length;
  const paginatedRecipes = mappedRecipes.slice(skip, skip + take);
  
  return { recipes: paginatedRecipes, totalCount, hasMore: skip + take < totalCount };
};

export const getRecipeBySlug = async (slug: string, userId?: string, activeHouseholdId?: string) => {
  const [recipe, context] = await Promise.all([
    prisma.recipe.findUnique({
      where: { slug },
      include: {
        ingredients: { orderBy: { order: 'asc' }, include: { ingredient: true, unit: true, modifier: true } },
        category: true, subcategory: true, tags: true, author: userProfileSelect,
        comments: { include: { user: userProfileSelect }, orderBy: { createdAt: 'desc' } },
        favorites: { where: { userId } }
      }
    }),
    getUserHouseholdContext(activeHouseholdId)
  ]);

  if (!recipe) return null;

  if (recipe.visibility === 'PRIVATE' && recipe.authorId !== userId) return null;
  if (recipe.visibility === 'HOUSEHOLD' && recipe.householdId !== activeHouseholdId && recipe.authorId !== userId) return null;

  return mapRecipeToDto(recipe, context.pantryIds, context.pantrySubGroups, context.householdStapleIds);
};

export const getFavoriteRecipes = async (userId: string, activeHouseholdId?: string) => {
  const [recipes, context] = await Promise.all([
    prisma.recipe.findMany({
      where: { favorites: { some: { userId } } },
      include: recipeIncludes(userId)
    }),
    getUserHouseholdContext(activeHouseholdId)
  ]);

  return recipes.map((recipe: any) => mapRecipeToDto(recipe, context.pantryIds, context.pantrySubGroups, context.householdStapleIds));
};

export const getAuthoredRecipes = async (userId: string, activeHouseholdId?: string) => {
  const [recipes, context] = await Promise.all([
    prisma.recipe.findMany({
      where: { authorId: userId },
      include: recipeIncludes(userId),
      orderBy: { createdAt: 'desc' }
    }),
    getUserHouseholdContext(activeHouseholdId)
  ]);

  return recipes.map((recipe: any) => mapRecipeToDto(recipe, context.pantryIds, context.pantrySubGroups, context.householdStapleIds));
};

export const toggleRecipeFavorite = async (userId: string, activeHouseholdId: string, recipeSlug: string) => {
    const recipe = await prisma.recipe.findUnique({ where: { slug: recipeSlug }, select: { id: true } });
    if (!recipe) throw new Error('Recipe not found');
  
    const existingFavorite = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId: recipe.id } },
    });
  
    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { userId_recipeId: { userId, recipeId: recipe.id } },
      });
      return { favorited: false };
    } else {
      await prisma.favorite.create({
        data: { 
          userId, 
          recipeId: recipe.id,
          householdId: activeHouseholdId
        },
      });
      return { favorited: true };
    }
  };
