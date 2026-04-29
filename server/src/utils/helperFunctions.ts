const userProfileSelect = {
    select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        alias: true
    }
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
};

/**
 * Generates a unique slug by appending a short random suffix.
 * Using a 6-character alphanumeric suffix provides ~2 billion permutations,
 * making collisions virtually impossible even with thousands of recipes.
 */
export const generateUniqueSlug = (name: string): string => {
  const baseSlug = slugify(name) || 'recipe';
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${suffix}`;
};

export const mapRecipeToDto = (
  recipe: any, 
  pantryIds: Set<string> = new Set(), 
  pantrySubGroups: Set<string> = new Set(),
  householdStapleIds: Set<string> = new Set(),
  showStaples: boolean = false,
  allowSubstitutions: boolean = true
) => {
  if (!recipe) return null;

  // Map and Flatten Ingredients (with Smart Substitutions & Hybrid Staples)
  const ingredients = recipe.ingredients?.map((ri: any) => {
    // An item is available if it's physically in the pantry OR if it's a household staple
    const isPhysicallyOwned = pantryIds.has(ri.ingredientId);
    const isPersonalStaple = householdStapleIds.has(ri.ingredientId);
    const inPantry = isPhysicallyOwned;

    // Check if missing but a valid substitute exists in the pantry
    const isSubstituted = !inPantry && !!ri.ingredient.subGroupId && pantrySubGroups.has(ri.ingredient.subGroupId);

    const isGlobalStaple = ri.ingredient.isDefaultStaple;
    const isStaple = isGlobalStaple || isPersonalStaple;

    return {
      id: ri.id,
      ingredientId: ri.ingredientId,
      sectionName: ri.sectionName,
      name: ri.ingredient.name,
      subGroupId: ri.ingredient.subGroupId,
      isStaple,
      isGlobalStaple,
      isPersonalStaple,
      amount: ri.amount,
      unit: ri.unit ? {
        id: ri.unit.id,
        name: ri.unit.name,
        abbreviation: ri.unit.abbreviation
      } : null,
      modifierId: ri.modifierId,
      modifier: ri.modifier ? ri.modifier.name : null,
      inPantry,
      isSubstituted
    };
  }) || [];

  // Calculate Missing Ingredients
  const missingIngredients = ingredients.filter((i: any) => {
      if (i.inPantry) return false;
      if (allowSubstitutions && i.isSubstituted) return false;
      if (!showStaples && i.isStaple) return false;
      return true;
  });

  const totalIngredients = ingredients.length;
  
  // Match percentage now benefits from substitutions!
  const matchPercentage = totalIngredients > 0 
    ? Math.round(((totalIngredients - missingIngredients.length) / totalIngredients) * 100)
    : 0;

  // Calculate Average Rating
  const validComments = recipe.comments?.filter((c: any) => c.rating > 0) || [];
  const avgRating = validComments.length > 0 
    ? Number((validComments.reduce((acc: number, c: any) => acc + c.rating, 0) / validComments.length).toFixed(1))
    : 0;

  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    summary: recipe.summary,
    instructions: recipe.instructions,
    notes: recipe.notes,
    visibility: recipe.visibility,
    
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    totalTime: recipe.totalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0),
    servings: recipe.servings || 1,
    imageUrl: recipe.imageUrl,
    nutrition: recipe.nutrition || {},
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,

    author: recipe.author ? {
      id: recipe.author.id,
      email: recipe.author.email,
      firstName: recipe.author.firstName,
      lastName: recipe.author.lastName,
      alias: recipe.author.alias,
      handle: recipe.author.email.split('@')[0]
    } : null,

    category: recipe.category ? {
      id: recipe.category.id,
      name: recipe.category.name
    } : null,
    
    subcategory: recipe.subcategory ? {
      id: recipe.subcategory.id,
      name: recipe.subcategory.name
    } : null,

    tags: recipe.tags?.map((t: any) => ({
      id: t.id,
      name: t.name,
      code: t.code
    })) || [],

    ingredients,
    missingIngredients, 
    missingCount: missingIngredients.length,
    matchPercentage,
    
    avgRating,
    isFavorite: !!recipe.favorites?.length,
    comments: recipe.comments?.map((comment: any) => ({
      ...comment,
      user: comment.user ? {
        id: comment.user.id,
        email: comment.user.email,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        alias: comment.user.alias
      } : null
    })),
  };
};
