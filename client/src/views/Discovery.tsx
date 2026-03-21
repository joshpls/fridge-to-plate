// src/pages/Discovery.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';
import FloatingAddButton from '../components/recipes/FloatingAddButton';
import { FilterBar } from '../components/recipes/FilterBar';
import { useAuth } from '../context/AuthContext';
import { taxonomyService } from '../services/taxonomyService';
import { API_BASE } from '../utils/apiConfig';

const Discovery: React.FC = () => {
    const { user, token } = useAuth();
    
    // 1. Data States
    const [recipes, setRecipes] = useState<any[]>([]);
    const [taxonomy, setTaxonomy] = useState<any>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    // 2. Filter States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Only updates when user hits Search
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    const [includeIngredients, setIncludeIngredients] = useState<string[]>([]);
    const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
    
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [showStaples, setShowStaples] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // 3. Pagination & Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

    // 4. Core Fetch Function
    const fetchRecipes = useCallback(async () => {
        if (loadingMore || (page > 1 && !hasMore)) return;
        page === 1 ? setLoading(true) : setLoadingMore(true);

        try {
            const params = new URLSearchParams({
                page: page.toString(), 
                limit: '12',
                sort: sortOrder
            });
            
            // Append all active filters
            if (selectedCategory) params.append('categoryId', selectedCategory);
            if (selectedSubcategory) params.append('subcategoryId', selectedSubcategory);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());
            if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
            if (includeIngredients.length > 0) params.append('includeIngredients', includeIngredients.join(','));
            if (excludeIngredients.length > 0) params.append('excludeIngredients', excludeIngredients.join(','));
            if (favoritesOnly) params.append('favoritesOnly', 'true');

            const response = await fetch(`${API_BASE}/recipes/matches?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.status === 'success') {
                const { recipes: newRecipes, hasMore: moreAvailable } = result.data;
                setRecipes(prev => page === 1 ? newRecipes : [...prev, ...newRecipes]);
                setHasMore(moreAvailable);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [
        page, searchQuery, selectedCategory, selectedSubcategory, 
        selectedTags, includeIngredients, excludeIngredients, 
        favoritesOnly, sortOrder, hasMore, loadingMore, token
    ]);

    // 5. Initial Taxonomy Load
    useEffect(() => {
        const fetchTaxonomy = async () => {
            const data = await taxonomyService.getTaxonomy();
            if (data) setTaxonomy(data);
        }
        fetchTaxonomy();
    }, []);

    // 6. Reset Watcher: Reset to page 1 whenever any filter changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
    }, [
        searchQuery, selectedCategory, selectedSubcategory, 
        selectedTags, includeIngredients, excludeIngredients, 
        favoritesOnly, sortOrder
    ]);

    // 7. Execution: Run fetch
    useEffect(() => {
        fetchRecipes();
    }, [page, fetchRecipes]);

    // 8. Infinite Scroll Watcher
    useEffect(() => {
        if (inView && hasMore && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    }, [inView, hasMore, loadingMore, loading]);

    // Handlers
    const handleExecuteSearch = () => {
        setSearchQuery(searchInput);
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => 
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            <header className="mb-6">
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                    Discover <span className="text-orange-600">Recipes</span>
                </h1>
            </header>

            <FilterBar 
                taxonomy={taxonomy}
                
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onExecuteSearch={handleExecuteSearch}

                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedSubcategory={selectedSubcategory}
                setSelectedSubcategory={setSelectedSubcategory}

                selectedTags={selectedTags}
                toggleTag={toggleTag}

                includeIngredients={includeIngredients}
                setIncludeIngredients={setIncludeIngredients}
                excludeIngredients={excludeIngredients}
                setExcludeIngredients={setExcludeIngredients}

                favoritesOnly={favoritesOnly}
                setFavoritesOnly={setFavoritesOnly}
                
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}

                showStaples={showStaples}
                setShowStaples={setShowStaples}
            />

            {/* Grid */}
            {loading && page === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-96 bg-gray-100 rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map((recipe: any) => (
                        <div key={recipe.slug} onClick={() => setSelectedRecipe(recipe)}>
                            <RecipeCard recipe={recipe} initialFavorite={recipe.isFavorite || false} showStaples={showStaples} />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {recipes.length === 0 && !loading && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <span className="text-4xl mb-4 block">🍳</span>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No recipes found</h3>
                    <p className="text-gray-500 font-medium max-w-md mx-auto">
                        Try adjusting your filters, removing excluded ingredients, or clearing your search term to find what you're looking for.
                    </p>
                    <button 
                        onClick={() => {
                            setSearchInput(''); setSearchQuery(''); setSelectedCategory(''); setSelectedSubcategory('');
                            setSelectedTags([]); setIncludeIngredients([]); setExcludeIngredients([]); setFavoritesOnly(false);
                        }}
                        className="mt-6 text-orange-600 font-bold hover:underline"
                    >
                        Clear all filters
                    </button>
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

            <FloatingAddButton />
        </div>
    );
};

export default Discovery;
