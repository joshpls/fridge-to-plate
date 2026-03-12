// src/components/recipes/RecipeCard.tsx
import React from 'react';
import { addIngredientsToShoppingList } from '../../utils/shoppingUtils';

interface RecipeCardProps {
    recipe: {
        id: string; // Added to help with backend requests
        name: string;
        slug: string;
        matchPercentage: number;
        missingCount: number;
        imageUrl?: string;
        // Added missingIngredients from your DTO
        missingIngredients: { id: string; name: string; amount?: string }[];
    };
    initialFavorite: boolean;
}

export const RecipeCard = ({ recipe, initialFavorite }: RecipeCardProps) => {
    const [isFavorite, setIsFavorite] = React.useState(initialFavorite);
    const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';

    React.useEffect(() => {
        setIsFavorite(initialFavorite);
    }, [initialFavorite]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`http://localhost:5000/api/recipes/${recipe.slug}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: TEMP_USER_ID })
            });
            if (response.ok) setIsFavorite(!isFavorite);
        } catch (err) {
            console.error("Failed to favorite recipe", err);
        }
    };

    // New function to handle bulk adding missing items
    const handleAddMissingToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const itemsToAdd = recipe.missingIngredients.map(ing => ({
            ingredientId: ing.id,
            amount: ing.amount || "",
            name: ing.name // Passing name to helper if you want to customize the toast
        }));

        await addIngredientsToShoppingList(itemsToAdd);
    };

    const getStatusColor = (percent: number) => {
        if (percent === 100) return 'text-green-500';
        if (percent >= 50) return 'text-yellow-500';
        return 'text-gray-400';
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full">
            <div className="h-48 bg-gray-200 relative">
                <button
                    onClick={toggleFavorite}
                    className={`absolute top-2 left-2 p-2 rounded-full shadow-sm transition-colors z-10 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
                        }`}
                >
                    {isFavorite ? '❤️' : '🤍'}
                </button>
                {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">🍳 No Image</div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow">
                    <span className={getStatusColor(recipe.matchPercentage)}>
                        {recipe.matchPercentage}% Match
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg truncate">{recipe.name}</h3>

                <div className="mt-2 flex-grow">
                    <p className="text-sm text-gray-500">
                        {recipe.missingCount === 0
                            ? "✨ You have everything!"
                            : `Missing ${recipe.missingCount} ingredients`}
                    </p>

                    {/* Display a small preview of missing ingredients */}
                    {recipe.missingCount > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {recipe.missingIngredients.slice(0, 2).map(ing => (
                                <span key={ing.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                    {ing.name}
                                </span>
                            ))}
                            {recipe.missingCount > 2 && (
                                <span className="text-[10px] text-gray-400">+{recipe.missingCount - 2} more</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-2">
                    {recipe.missingCount > 0 && (
                        <button
                            onClick={handleAddMissingToCart}
                            className="w-full text-xs font-bold text-orange-600 border border-orange-200 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                            🛒 Add Missing to List
                        </button>
                    )}
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors">
                        View Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};
