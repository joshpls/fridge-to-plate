export const mapRecipeToDto = (recipe: any, pantryIds: Set<string>) => {
  const matched = recipe.ingredients.filter((ri: any) => pantryIds.has(ri.ingredientId));
  
  const missingIngredients = recipe.ingredients.filter((ri: any) => !pantryIds.has(ri.ingredientId));

  const matchPercentage = recipe.ingredients.length > 0 
    ? Math.round((matched.length / recipe.ingredients.length) * 100)
    : 0;

  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients, // Full list for the detail view
    matchPercentage,
    missingCount: (recipe.ingredients?.length || 0) - matched.length,
    missingIngredients: missingIngredients.map((ri: any) => ({
      id: ri.ingredientId,
      name: ri.ingredient.name,
      amount: ri.amount
    })),
    isFavorite: recipe.favorites?.length > 0,
    isVegan: recipe.isVegan,
    isGlutenFree: recipe.isGlutenFree,
  };
};
