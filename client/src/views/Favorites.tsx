// src/views/Favorites.tsx
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';
import { useAuth } from '../context/AuthContext';
import { Search, Edit3, Trash2, Heart, ChefHat } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

const Favorites = () => {
    const { user, token, isAuthenticated } = useAuth();
    const userId = user?.id;

    // View State
    const [activeTab, setActiveTab] = useState<'favorites' | 'authored'>('favorites');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Data State
    const [favorites, setFavorites] = useState<any[]>([]);
    const [authored, setAuthored] = useState<any[]>([]);

    useEffect(() => {
        const fetchCookbookData = async () => {
            if (!isAuthenticated || !token) return;

            setLoading(true);
            try {
                // CLEANUP: Remove the ?userId= query string. 
                // The backend gets the ID from the Bearer token now.
                const [favRes, authRes] = await Promise.all([
                    fetchWithAuth(`${API_BASE}/recipes/favorites`),
                    fetchWithAuth(`${API_BASE}/recipes/authored`)
                ]);

                if (favRes.ok && authRes.ok) {
                    const favData = await favRes.json();
                    const authData = await authRes.json();
                    setFavorites(favData.data || []);
                    setAuthored(authData.data || []);
                }
            } catch (err) {
                console.error("Error fetching cookbook data:", err);
                toast.error("Failed to load your recipes");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCookbookData();
    }, [userId, token, isAuthenticated]);

    // Instant Client-Side Search
    const displayedRecipes = useMemo(() => {
        const sourceData = activeTab === 'favorites' ? favorites : authored;
        if (!searchQuery.trim()) return sourceData;
        
        const lowerQuery = searchQuery.toLowerCase();
        return sourceData.filter(r => 
            r.name.toLowerCase().includes(lowerQuery) ||
            r.category?.name.toLowerCase().includes(lowerQuery) ||
            r.tags?.some((t: any) => t.name.toLowerCase().includes(lowerQuery))
        );
    }, [activeTab, favorites, authored, searchQuery]);

    const handleDelete = async (e: React.MouseEvent, recipeId: string, recipeName: string) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to permanently delete "${recipeName}"?`)) return;

        try {
            const res = await fetch(`${API_BASE}/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success("Recipe deleted");
                // Remove from local state instantly
                setAuthored(prev => prev.filter(r => r.id !== recipeId));
                // If it was also favorited, remove it there too
                setFavorites(prev => prev.filter(r => r.id !== recipeId)); 
            } else {
                toast.error("Failed to delete recipe");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse">Opening your cookbook...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 pb-24">
            
            {/* Header & Controls */}
            <header className="mb-10 space-y-6 md:space-y-0 md:flex md:items-end md:justify-between border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-6">My Cookbook</h1>
                    
                    {/* FANG-Style Segmented Control */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-sm">
                        <button 
                            onClick={() => setActiveTab('favorites')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                activeTab === 'favorites' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Heart size={16} className={activeTab === 'favorites' ? 'fill-red-500 text-red-500' : ''} />
                            Saved ({favorites.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('authored')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                activeTab === 'authored' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <ChefHat size={16} className={activeTab === 'authored' ? 'text-orange-500' : ''} />
                            My Recipes ({authored.length})
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab === 'favorites' ? 'favorites' : 'my recipes'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-medium text-sm"
                    />
                </div>
            </header>

            {/* Grid Content */}
            {displayedRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displayedRecipes.map((recipe: any) => (
                        <div key={recipe.id} className="relative group cursor-pointer h-full">
                            
                            {/* The standard Recipe Card */}
                            <div onClick={() => setSelectedRecipe(recipe)} className="h-full">
                                <RecipeCard 
                                    recipe={recipe} 
                                    initialFavorite={favorites.some(f => f.id === recipe.id)} 
                                />
                            </div>

                            {/* Hover Actions (Only shown on Authored Tab) */}
                            {activeTab === 'authored' && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-10 translate-y-2 group-hover:translate-y-0">
                                    <Link 
                                        to={`/edit-recipe/${recipe.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-white/95 backdrop-blur text-gray-700 p-2.5 rounded-xl shadow-xl border border-gray-100 hover:text-blue-600 hover:scale-110 transition-all"
                                        title="Edit Recipe"
                                    >
                                        <Edit3 size={18} />
                                    </Link>
                                    <button 
                                        onClick={(e) => handleDelete(e, recipe.id, recipe.name)}
                                        className="bg-white/95 backdrop-blur text-gray-700 p-2.5 rounded-xl shadow-xl border border-gray-100 hover:text-red-600 hover:scale-110 transition-all"
                                        title="Delete Recipe"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty States */
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    {searchQuery ? (
                        <p className="text-gray-500 font-medium">No recipes found matching "{searchQuery}"</p>
                    ) : activeTab === 'favorites' ? (
                        <>
                            <p className="text-gray-500 font-medium mb-4">You haven't saved any recipes yet.</p>
                            <Link to="/discovery" className="bg-orange-100 text-orange-700 px-6 py-2 rounded-xl font-bold hover:bg-orange-200 transition-colors">
                                Discover Recipes
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-500 font-medium mb-4">You haven't created any recipes yet.</p>
                            <Link to="/recipe/add" className="bg-orange-100 text-orange-700 px-6 py-2 rounded-xl font-bold hover:bg-orange-200 transition-colors">
                                Create a Recipe
                            </Link>
                        </>
                    )}
                </div>
            )}

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