import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import RecipeCard from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';
import FloatingAddButton from '../components/recipes/FloatingAddButton';
import { FilterBar } from '../components/recipes/FilterBar';
import { taxonomyService } from '../services/taxonomyService';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

const Discovery: React.FC = () => {
    const location = useLocation();
    
    const [recipes, setRecipes] = useState<any[]>([]);
    const [taxonomy, setTaxonomy] = useState<any>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    // Filter States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [includeIngredients, setIncludeIngredients] = useState<string[]>(location.state?.includeIngredients || []);
    const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [showStaples, setShowStaples] = useState(false);
    const [allowSubstitutions, setAllowSubstitutions] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [scope, setScope] = useState<'all' | 'household' | 'mine'>('all');
    const [matchOnly, setMatchOnly] = useState(location.state?.filterByPantry || false);

    // Pagination & Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    const isInitialMount = useRef(true);

    const filtersStr = JSON.stringify({
        searchQuery, selectedCategory, selectedSubcategory, 
        selectedTags, includeIngredients, excludeIngredients, 
        favoritesOnly, sortOrder, showStaples, allowSubstitutions, matchOnly, scope
    });

    const lastFiltersRef = useRef(filtersStr);

    useEffect(() => {
        let isSubscribed = true;
        const isNewSearch = lastFiltersRef.current !== filtersStr;
        lastFiltersRef.current = filtersStr;

        if (isNewSearch && page !== 1) {
            setPage(1);
            return;
        }

        const loadData = async () => {
            if (page > 1 && !hasMore) return;

            try {
                page === 1 ? setLoading(true) : setLoadingMore(true);

                // Determine if we are in a pure, unfiltered default state
                const isDefaultSearch = 
                    searchQuery === '' && selectedCategory === '' && selectedSubcategory === '' &&
                    selectedTags.length === 0 && includeIngredients.length === 0 &&
                    excludeIngredients.length === 0 && !favoritesOnly &&
                    sortOrder === 'asc' && !showStaples && !matchOnly && scope === 'all';

                // --- BOOTSTRAP (Fast Initial Load) ---
                if (isInitialMount.current && isDefaultSearch && page === 1) {
                    const res = await fetchWithAuth(`${API_BASE}/discovery/bootstrap`);
                    const result = await res.json();

                    if (isSubscribed && result.status === 'success') {
                        setTaxonomy(result.data.taxonomy);
                        setRecipes(result.data.recipes);
                        setHasMore(result.data.totalRecipes > result.data.recipes.length);
                        isInitialMount.current = false;
                        return; // Exit early, we got the DTO!
                    }
                }

                isInitialMount.current = false;

                // SPECIFIC FETCHING (Filters or Pagination Active) ---
                
                // 1. Ensure taxonomy is loaded if we bypassed the bootstrap
                if (!taxonomy) {
                    const taxData = await taxonomyService.getTaxonomy();
                    if (isSubscribed && taxData) setTaxonomy(taxData);
                }

                // 2. Fetch specific recipes
                const params = new URLSearchParams({
                    page: page.toString(), limit: '12', sort: sortOrder
                });
                
                if (selectedCategory) params.append('categoryId', selectedCategory);
                if (selectedSubcategory) params.append('subcategoryId', selectedSubcategory);
                if (searchQuery.trim()) params.append('search', searchQuery.trim());
                if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
                if (includeIngredients.length > 0) params.append('includeIngredients', includeIngredients.join(','));
                if (excludeIngredients.length > 0) params.append('excludeIngredients', excludeIngredients.join(','));
                if (favoritesOnly) params.append('favoritesOnly', 'true');
                if (matchOnly) params.append('matchOnly', 'true');
                if (showStaples) params.append('showStaples', 'true');
                if (allowSubstitutions === false) params.append('allowSubstitutions', 'false');
                if (scope !== 'all') params.append('scope', scope);

                const response = await fetchWithAuth(`${API_BASE}/recipes/matches?${params.toString()}`);
                const result = await response.json();

                if (isSubscribed && result.status === 'success') {
                    const { recipes: newRecipes, hasMore: moreAvailable } = result.data;
                    setRecipes(prev => {
                        if (page === 1) return newRecipes;
                        const existingIds = new Set(prev.map((r: any) => r.id));
                        const uniqueNew = newRecipes.filter((r: any) => !existingIds.has(r.id));
                        return [...prev, ...uniqueNew];
                    });
                    setHasMore(moreAvailable);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        };

        loadData();
        return () => { isSubscribed = false; };
    }, [page, filtersStr]); 

    // Handle Infinite Scroll
    useEffect(() => {
        if (inView && hasMore && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    }, [inView, hasMore, loadingMore, loading]);

    const handleExecuteSearch = () => setSearchQuery(searchInput);
    const toggleTag = (tagId: string) => setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);

    const handleClearFilters = () => {
        setSearchInput(''); setSearchQuery(''); setSelectedCategory(''); setSelectedSubcategory('');
        setSelectedTags([]); setIncludeIngredients([]); setExcludeIngredients([]); setFavoritesOnly(false);
        setShowStaples(false); setAllowSubstitutions(true); setSortOrder('asc'); setMatchOnly(false); setScope('all');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            <header className="mb-6">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                    Discover <span className="text-orange-600">Recipes</span>
                </h1>
            </header>

            <FilterBar 
                taxonomy={taxonomy}
                searchInput={searchInput} setSearchInput={setSearchInput}
                onExecuteSearch={handleExecuteSearch}
                selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                selectedSubcategory={selectedSubcategory} setSelectedSubcategory={setSelectedSubcategory}
                selectedTags={selectedTags} toggleTag={toggleTag}
                includeIngredients={includeIngredients} setIncludeIngredients={setIncludeIngredients}
                excludeIngredients={excludeIngredients} setExcludeIngredients={setExcludeIngredients}
                favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly}
                sortOrder={sortOrder} setSortOrder={setSortOrder}
                showStaples={showStaples} setShowStaples={setShowStaples}
                allowSubstitutions={allowSubstitutions}
                setAllowSubstitutions={setAllowSubstitutions}
                matchOnly={matchOnly} setMatchOnly={setMatchOnly}
                scope={scope} setScope={setScope} 
                onClearFilters={handleClearFilters}
            />

            {/* Grid */}
            {loading && page === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl" />)}
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
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <span className="text-4xl mb-4 block">🍳</span>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No recipes found</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
                        Try adjusting your filters, removing excluded ingredients, or clearing your search term to find what you're looking for.
                    </p>
                    <button onClick={handleClearFilters} className="mt-6 text-orange-600 font-bold hover:underline">
                        Clear all filters
                    </button>
                </div>
            )}

            {hasMore && recipes.length > 0 && (
                <div ref={loadMoreRef} className="py-10 text-center">
                    {loadingMore ? <span className="text-gray-400 font-bold animate-pulse">Loading more recipes...</span> : <span className="text-transparent">Scroll trigger</span>}
                </div>
            )}

            {!hasMore && recipes.length > 0 && (
                <div className="py-10 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
                    You've reached the end
                </div>
            )}

            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
            {!selectedRecipe && <FloatingAddButton />}
        </div>
    );
};

export default Discovery;
