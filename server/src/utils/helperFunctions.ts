export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
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

export const mapRecipeToDto = (recipe: any, pantryIds: Set<string> = new Set()) => {
  if (!recipe) return null;

  // 1. Map and Flatten Ingredients first so we can use them for calculations
  const ingredients = recipe.ingredients?.map((ri: any) => ({
    id: ri.id,
    ingredientId: ri.ingredientId,
    name: ri.ingredient.name,
    isStaple: ri.ingredient.isStaple,
    amount: ri.amount, // Float from schema
    unit: ri.unit ? {
      id: ri.unit.id,
      name: ri.unit.name,
      abbreviation: ri.unit.abbreviation
    } : null,
    inPantry: pantryIds.has(ri.ingredientId)
  })) || [];

  const missingIngredients = ingredients.filter((i: any) => !i.inPantry && !i.isStaple);
  const totalIngredients = ingredients.length;
  
  // Match percentage based on what the user actually HAS vs needs to GET
  const matchPercentage = totalIngredients > 0 
    ? Math.round(((totalIngredients - missingIngredients.length) / totalIngredients) * 100)
    : 0;

  // 3. Complete Data Return (Restored metadata)
  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    summary: recipe.summary,
    instructions: recipe.instructions,
    notes: recipe.notes,
    
    // Times & Servings
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    totalTime: recipe.totalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0),
    servings: recipe.servings || 1,
    imageUrl: recipe.imageUrl,

    // Nutrition (JSON)
    nutrition: recipe.nutrition || {},

    // Author (Sanitized)
    author: recipe.author ? {
      email: recipe.author.email,
      handle: recipe.author.email.split('@')[0]
    } : null,

    // Category & Subcategory (Objects)
    category: recipe.category ? {
      id: recipe.category.id,
      name: recipe.category.name
    } : null,
    
    subcategory: recipe.subcategory ? {
      id: recipe.subcategory.id,
      name: recipe.subcategory.name
    } : null,

    // Tags
    tags: recipe.tags?.map((t: any) => ({
      id: t.id,
      name: t.name,
      code: t.code
    })) || [],

    // Flattened Ingredients & Computed Fields
    ingredients,
    missingIngredients, 
    missingCount: missingIngredients.length,
    matchPercentage,
    
    // Favorites & Comments
    isFavorite: !!recipe.favorites?.length,
    comments: recipe.comments?.map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: c.user?.email.split('@')[0]
    })) || []
  };
};
