// src/components/recipes/RecipeCard.tsx
import React from 'react';

interface RecipeCardProps {
    recipe: {
        name: string;
        slug: string;
        matchPercentage: number;
        missingCount: number;
        imageUrl?: string;
    };
    initialFavorite: boolean;
}

export const RecipeCard = ({ recipe, initialFavorite }: RecipeCardProps) => {
    const [isFavorite, setIsFavorite] = React.useState(initialFavorite);

    React.useEffect(() => {
        setIsFavorite(initialFavorite);
    }, [initialFavorite]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger the "View Recipe" click

        try {
            const response = await fetch(`http://localhost:5000/api/recipes/${recipe.slug}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000' }) // Using your TEMP_USER_ID
            });

            if (response.ok) setIsFavorite(!isFavorite);
        } catch (err) {
            console.error("Failed to favorite recipe", err);
        }
    };

    const getStatusColor = (percent: number) => {
        if (percent === 100) return 'text-green-500';
        if (percent >= 50) return 'text-yellow-500';
        return 'text-gray-400';
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
            <div className="h-48 bg-gray-200 relative">
                <button
                    onClick={toggleFavorite}
                    className={`absolute top-2 left-2 p-2 rounded-full shadow-sm transition-colors ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
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
            <div className="p-4">
                <h3 className="font-bold text-lg truncate">{recipe.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {recipe.missingCount === 0
                        ? "You have everything!"
                        : `Missing ${recipe.missingCount} ingredients`}
                </p>
                <button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors">
                    View Recipe
                </button>
            </div>
        </div>
    );
};
