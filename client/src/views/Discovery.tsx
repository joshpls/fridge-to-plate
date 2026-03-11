import React, { useEffect, useState } from 'react';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';

// Define our filter shape for easy expansion later
const DIETARY_FILTERS = [
    { id: 'isVegan', label: '🌱 Vegan' },
    { id: 'isGlutenFree', label: '🌾 Gluten-Free' },
    { id: 'isDairyFree', label: '🥛 Dairy-Free' },
];

export const Discovery: React.FC = () => {
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/recipes/matches');
                const result = await response.json();

                if (result.status === 'success') {
                    setRecipes(result.data);
                } else {
                    console.error("Backend Error:", result.message);
                    setRecipes([]); // Keep it an array to avoid crashes
                }
            } catch (error) {
                setRecipes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

    // Filter logic: This runs whenever activeFilters or the master recipes list changes
    useEffect(() => {
        let result = [...recipes];

        activeFilters.forEach(filterId => {
            result = result.filter((recipe: any) => recipe[filterId] === true);
        });

        setFilteredRecipes(result);
    }, [activeFilters, recipes]);

    const toggleFilter = (id: string) => {
        setActiveFilters(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Scanning your fridge...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Recipe Discovery</h1>
                    <p className="text-gray-600">Matched with your current pantry</p>
                </div>

                {/* Dynamic Filter Bar */}
                <div className="flex flex-wrap gap-2">
                    {DIETARY_FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => toggleFilter(filter.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${activeFilters.includes(filter.id)
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe: any) => (
                    <div key={recipe.slug} onClick={() => setSelectedRecipe(recipe)} className="cursor-pointer">
                        <RecipeCard recipe={recipe} initialFavorite={recipe.isFavorite} />
                    </div>
                ))}
            </div>

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