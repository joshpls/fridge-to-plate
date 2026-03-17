// src/components/recipes/RecipeCard.tsx
import React from 'react';
import { addIngredientsToShoppingList } from '../../utils/shoppingUtils'; // Or use storageService directly
import { useAuth } from '../../context/AuthContext';

interface RecipeCardProps {
    recipe: any;
    initialFavorite: boolean;
}

export const RecipeCard = ({ recipe, initialFavorite }: RecipeCardProps) => {
    const [isFavorite, setIsFavorite] = React.useState(initialFavorite);
    const { user, isAuthenticated } = useAuth();
    const userId = user?.id;

    const missingIngredients = recipe.ingredients?.filter((ing: any) => !ing.inPantry && !ing.isStaple) || [];
    const missingCount = missingIngredients.length;

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`http://localhost:5000/api/recipes/${recipe.slug}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (response.ok) setIsFavorite(!isFavorite);
        } catch (err) {
            console.error("Failed to favorite recipe", err);
        }
    };

    const handleAddMissingToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const items = missingIngredients.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            name: ing.name,
            amount: `${ing.amount} ${ing.unit?.abbreviation || ''}`.trim()
        }));
        await addIngredientsToShoppingList(items);
    };

    return (
        <div className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
                    {recipe.tags?.map((tag: any) => (
                        <span key={tag.id} title={tag.name} className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
                            {tag.code}
                        </span>
                    ))}
                </div>
                {isAuthenticated &&
                    <button
                        onClick={toggleFavorite}
                        className={`absolute top-3 right-3 p-2.5 rounded-2xl transition-all shadow-lg ${isFavorite ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-400 hover:text-orange-500'
                            }`}
                    >
                        {isFavorite ? '❤️' : '🤍'}
                    </button>
                }
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur shadow-sm px-3 py-1.5 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Match</p>
                    <p className="text-sm font-black text-orange-600 leading-none">{recipe.matchPercentage}%</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="mb-3">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                        {/* Now safely accesses the category object */}
                        {recipe.category?.name || "General"} 
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1 mt-0.5 group-hover:text-orange-600 transition-colors">
                        {recipe.name}
                    </h3>
                </div>

                {/* Ingredients Preview */}
                <div className="mb-4 flex-1">
                    {missingCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {missingIngredients.slice(0, 2).map((ing: any, idx: number) => (
                                <span key={idx} className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-md font-medium">
                                    {ing.name}
                                </span>
                            ))}
                            {missingCount > 2 && (
                                <span className="text-[10px] text-gray-300 font-bold">+{missingCount - 2} more</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-green-600">
                            <span className="text-xs">✨</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Fully Stocked</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-2 mt-auto">
                    {missingCount > 0 && (
                        <button
                            onClick={handleAddMissingToCart}
                            className="w-full py-3 rounded-xl border-2 border-orange-50 hover:bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            🛒 Add Missing
                        </button>
                    )}
                    <button className="w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-gray-100">
                        View Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};
