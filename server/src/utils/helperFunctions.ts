export const mapRecipeToDto = (recipe: any, pantryIds: Set<string>) => {
  const matched = recipe.ingredients.filter((ri: any) => pantryIds.has(ri.ingredientId));
  const matchPercentage = Math.round((matched.length / recipe.ingredients.length) * 100);

  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    matchPercentage,
    missingCount: recipe.ingredients.length - matched.length,
    isFavorite: recipe.favorites?.length > 0,
    isVegan: recipe.isVegan,
    isGlutenFree: recipe.isGlutenFree,
  };
};
