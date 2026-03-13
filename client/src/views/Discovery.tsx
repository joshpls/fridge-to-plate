import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';

const Discovery: React.FC = () => {
    // 1. Data States
    const [recipes, setRecipes] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    // 2. Filter States
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    // Separation of Input (what the user types) vs Query (what we send to the backend)
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // 3. Pagination & Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Intersection Observer to detect when user scrolls to the bottom
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

    const userId = '00000000-0000-0000-0000-000000000000';

    // -- METADATA CACHING --
    useEffect(() => {
        const fetchMetadata = async () => {
            // Check session storage first
            const cached = sessionStorage.getItem('discovery_meta');
            if (cached) {
                const { cats, tags } = JSON.parse(cached);
                setCategories(cats);
                setAvailableTags(tags);
                return;
            }

            try {
                const [catRes, tagRes] = await Promise.all([
                    fetch('http://localhost:5000/api/recipes/categories'),
                    fetch('http://localhost:5000/api/recipes/tags')
                ]);
                const cats = await catRes.json();
                const tags = await tagRes.json();
                
                if (cats.status === 'success' && tags.status === 'success') {
                    setCategories(cats.data);
                    setAvailableTags(tags.data);
                    // Cache for future visits
                    sessionStorage.setItem('discovery_meta', JSON.stringify({ cats: cats.data, tags: tags.data }));
                }
            } catch (error) {
                console.error("Failed to load metadata:", error);
            }
        };
        fetchMetadata();
    }, []);

    // -- DEBOUNCE SEARCH --
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 400); // Wait 400ms after user stops typing to trigger a filter change
        return () => clearTimeout(handler);
    }, [searchInput]);

    // -- RESET PAGINATION ON FILTER CHANGE --
    useEffect(() => {
        setPage(1);
        setRecipes([]);
        setHasMore(true);
    }, [selectedCategory, searchQuery, selectedTags]);

    // -- FETCH RECIPES (Initial Load + Pagination) --
    const fetchRecipes = useCallback(async () => {
        if (!hasMore && page > 1) return;
        
        page === 1 ? setLoading(true) : setLoadingMore(true);

        try {
            const params = new URLSearchParams({ userId, page: page.toString(), limit: '12' });
            if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());
            if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

            const response = await fetch(`http://localhost:5000/api/recipes/matches?${params.toString()}`);
            const result = await response.json();

            if (result.status === 'success') {
                const { recipes: newRecipes, hasMore: moreAvailable } = result.data; // Destructure the new backend object
                
                setRecipes(prev => page === 1 ? newRecipes : [...prev, ...newRecipes]);
                setHasMore(moreAvailable);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [page, selectedCategory, searchQuery, selectedTags, userId, hasMore]);

    // Trigger fetch when page or filters update
    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    // -- TRIGGER INFINITE SCROLL --
    useEffect(() => {
        if (inView && hasMore && !loading && !loadingMore) {
            setPage(prev => prev + 1);
        }
    }, [inView, hasMore, loading, loadingMore]);

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            <header className="mb-10 sticky top-0 bg-white/95 backdrop-blur-md z-20 py-4 shadow-sm rounded-b-3xl -mx-6 px-6">
                <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tighter">
                    Discover <span className="text-orange-600">Recipes</span>
                </h1>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input 
                            type="text"
                            placeholder="Search by recipe name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="md:w-64 p-4 rounded-2xl border-2 border-gray-100 bg-white font-bold text-gray-700 outline-none cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Expandable Tags */}
                <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag: any) => (
                        <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                selectedTags.includes(tag.id)
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200'
                            }`}
                        >
                            {tag.code} {tag.name}
                        </button>
                    ))}
                    {selectedTags.length > 0 && (
                        <button onClick={() => setSelectedTags([])} className="text-[10px] font-bold text-orange-600 ml-2 hover:underline uppercase">
                            Clear Tags
                        </button>
                    )}
                </div>
            </header>

            {/* Grid */}
            {loading && page === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-gray-100 rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map((recipe: any) => (
                        <div key={recipe.slug} onClick={() => setSelectedRecipe(recipe)} className="cursor-pointer h-full">
                            <RecipeCard recipe={recipe} initialFavorite={recipe.isFavorite} />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {recipes.length === 0 && !loading && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg font-medium">No recipes match your current filters.</p>
                </div>
            )}

            {/* Infinite Scroll Trigger Line */}
            {hasMore && recipes.length > 0 && (
                <div ref={loadMoreRef} className="py-10 text-center">
                    {loadingMore ? (
                        <span className="text-gray-400 font-bold animate-pulse">Loading more recipes...</span>
                    ) : (
                        <span className="text-transparent">Scroll trigger</span>
                    )}
                </div>
            )}
            
            {!hasMore && recipes.length > 0 && (
                <div className="py-10 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
                    You've reached the end
                </div>
            )}

            {/* Modal */}
            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}
        </div>
    );
};

export default Discovery;
