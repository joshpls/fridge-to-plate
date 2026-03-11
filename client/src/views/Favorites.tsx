// src/views/Favorites.tsx
import { useEffect, useState } from 'react';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/recipes/favorites?userId=00000000-0000-0000-0000-000000000000');
                const result = await response.json();
                if (result.status === 'success') setFavorites(result.data);
            } catch (error) {
                console.error("Error loading favorites", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading your cookbook...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Favorite Recipes</h1>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((recipe: any) => (
                        <div key={recipe.slug} onClick={() => setSelectedRecipe(recipe)} className="cursor-pointer">
                            <RecipeCard recipe={recipe} initialFavorite={true} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-500">You haven't saved any recipes yet. Go find some favorites!</p>
                </div>
            )}

            {/* The Modal Trigger */}
            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}
        </div>
    );
};

export default Favorites;