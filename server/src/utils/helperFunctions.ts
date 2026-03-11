export const mapRecipeToDto = (recipe: any, pantryIds: Set<string>) => {
  const matched = recipe.ingredients.filter((ri: any) => pantryIds.has(ri.ingredientId));
  const matchPercentage = Math.round((matched.length / recipe.ingredients.length) * 100);

  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients,
    matchPercentage,
    missingCount: (recipe.ingredients?.length || 0) - matched.length,
    isFavorite: recipe.favorites?.length > 0,
    isVegan: recipe.isVegan,
    isGlutenFree: recipe.isGlutenFree,
  };
};
