import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import RecipeCard from '../components/recipes/RecipeCard';
import { RecipeModal } from '../components/recipes/RecipeModal';
import FloatingAddButton from '../components/recipes/FloatingAddButton';
import { FilterBar } from '../components/recipes/FilterBar';
import { taxonomyService } from '../services/taxonomyService';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { useDiscoveryFilters } from '../hooks/useDiscoveryFilters';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext'; // [NEW] Added to track auth state

const Discovery: React.FC = () => {
    const filters = useDiscoveryFilters();
    const { user } = useAuth(); // [NEW] Get current user
    
    const [recipes, setRecipes] = useState<any[]>([]);
    const [taxonomy, setTaxonomy] = useState<any>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    // Pagination & Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Restoration States
    const [isRestoring, setIsRestoring] = useState(true);
    const restoredPageRef = useRef<number | null>(null);

    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    const isInitialMount = useRef(true);

    const filtersStr = JSON.stringify({
        searchQuery: filters.searchQuery, 
        selectedCategory: filters.selectedCategory, 
        selectedSubcategory: filters.selectedSubcategory, 
        selectedTags: filters.selectedTags, 
        includeIngredients: filters.includeIngredients, 
        excludeIngredients: filters.excludeIngredients, 
        favoritesOnly: filters.favoritesOnly, 
        sortOrder: filters.sortOrder, 
        showStaples: filters.showStaples, 
        allowSubstitutions: filters.allowSubstitutions, 
        matchOnly: filters.matchOnly, 
        scope: filters.scope,
        userId: user?.id 
    });

    const lastFiltersRef = useRef(filtersStr);

    useEffect(() => {
        const loadTaxonomy = async () => {
            try {
                const taxData = await taxonomyService.getTaxonomy();
                if (taxData) setTaxonomy(taxData);
            } catch (err) {
                console.error("Failed to load taxonomy", err);
            }
        };
        if (!taxonomy) loadTaxonomy();
    }, [taxonomy]);

    // --- RESTORE STATE ON MOUNT ---
    useLayoutEffect(() => {
        const cachedState = storageService.cache.getDiscoveryState();
        
        if (cachedState && cachedState.recipes.length > 0) {
            setRecipes(cachedState.recipes);
            setPage(cachedState.page || 1);
            setHasMore(cachedState.hasMore ?? true);
            
            restoredPageRef.current = cachedState.page || 1; 
            
            requestAnimationFrame(() => {
                window.scrollTo(0, cachedState.scrollY);
            });
        }
        setIsRestoring(false);
    }, []);

    // --- SAVE STATE CONTINUOUSLY ---
    useEffect(() => {
        if (!isRestoring && recipes.length > 0) {
            storageService.cache.setDiscoveryState({
                recipes,
                page,
                hasMore,
                scrollY: window.scrollY
            });
        }
    }, [recipes, page, hasMore, isRestoring]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const currentState = storageService.cache.getDiscoveryState();
                if (currentState) {
                    storageService.cache.setDiscoveryState({ ...currentState, scrollY: window.scrollY });
                }
            }, 150); 
        };
        window.addEventListener('scroll', handleScroll);
        return () => { window.removeEventListener('scroll', handleScroll); if (timeoutId) clearTimeout(timeoutId); };
    }, []);

    // --- FETCHING DATA ---
    useEffect(() => {
        if (isRestoring) return; 

        let isSubscribed = true;
        const isNewSearch = lastFiltersRef.current !== filtersStr;
        lastFiltersRef.current = filtersStr;

        if (isNewSearch) {
            storageService.cache.clearDiscoveryState(); // Wipe cache on new filter or Auth change
            if (page !== 1) {
                setPage(1);
                return;
            }
        }

        // Skip network fetch if we JUST restored this exact page from cache
        if (!isNewSearch && restoredPageRef.current === page) {
            restoredPageRef.current = null;
            setLoading(false);
            return;
        }

        const loadData = async () => {
            if (page > 1 && !hasMore) return;

            try {
                page === 1 ? setLoading(true) : setLoadingMore(true);

                const isDefaultSearch = 
                    filters.searchQuery === '' && filters.selectedCategory === '' && filters.selectedSubcategory === '' &&
                    filters.selectedTags.length === 0 && filters.includeIngredients.length === 0 &&
                    filters.excludeIngredients.length === 0 && !filters.favoritesOnly &&
                    filters.sortOrder === 'asc' && !filters.showStaples && !filters.matchOnly && filters.scope === 'all';

                // --- BOOTSTRAP ---
                if (isInitialMount.current && isDefaultSearch && page === 1) {
                    const res = await fetchWithAuth(`${API_BASE}/discovery/bootstrap`);
                    const result = await res.json();

                    if (isSubscribed && result.status === 'success') {
                        if (!taxonomy) setTaxonomy(result.data.taxonomy);
                        setRecipes(result.data.recipes);
                        setHasMore(result.data.totalRecipes > result.data.recipes.length);
                        isInitialMount.current = false;
                        return;
                    }
                }

                isInitialMount.current = false;

                // --- SPECIFIC FETCHING ---
                const params = new URLSearchParams({
                    page: page.toString(), limit: '12', sort: filters.sortOrder
                });
                
                if (filters.selectedCategory) params.append('categoryId', filters.selectedCategory);
                if (filters.selectedSubcategory) params.append('subcategoryId', filters.selectedSubcategory);
                if (filters.searchQuery.trim()) params.append('search', filters.searchQuery.trim());
                if (filters.selectedTags.length > 0) params.append('tags', filters.selectedTags.join(','));
                if (filters.includeIngredients.length > 0) params.append('includeIngredients', filters.includeIngredients.join(','));
                if (filters.excludeIngredients.length > 0) params.append('excludeIngredients', filters.excludeIngredients.join(','));
                if (filters.favoritesOnly) params.append('favoritesOnly', 'true');
                if (filters.matchOnly) params.append('matchOnly', 'true');
                if (filters.showStaples) params.append('showStaples', 'true');
                if (filters.allowSubstitutions === false) params.append('allowSubstitutions', 'false');
                if (filters.scope !== 'all') params.append('scope', filters.scope);

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
    }, [page, filtersStr, isRestoring, taxonomy]); // Added taxonomy dependency

    // Trigger next page on scroll
    useEffect(() => {
        if (inView && hasMore && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    }, [inView, hasMore, loadingMore, loading]);

    // Handle closing the modal and updating the local array if favorite was toggled
    const handleCloseModal = () => {
        if (selectedRecipe) {
            setRecipes(prev => prev.map(r => r.id === selectedRecipe.id ? { ...r, isFavorite: selectedRecipe.isFavorite } : r));
        }
        setSelectedRecipe(null);
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
                searchInput={filters.searchInput} setSearchInput={filters.setSearchInput}
                onExecuteSearch={filters.handleExecuteSearch}
                selectedCategory={filters.selectedCategory} setSelectedCategory={filters.setSelectedCategory}
                selectedSubcategory={filters.selectedSubcategory} setSelectedSubcategory={filters.setSelectedSubcategory}
                selectedTags={filters.selectedTags} toggleTag={filters.toggleTag}
                includeIngredients={filters.includeIngredients} setIncludeIngredients={filters.setIncludeIngredients}
                excludeIngredients={filters.excludeIngredients} setExcludeIngredients={filters.setExcludeIngredients}
                favoritesOnly={filters.favoritesOnly} setFavoritesOnly={filters.setFavoritesOnly}
                sortOrder={filters.sortOrder} setSortOrder={filters.setSortOrder}
                showStaples={filters.showStaples} setShowStaples={filters.setShowStaples}
                allowSubstitutions={filters.allowSubstitutions} setAllowSubstitutions={filters.setAllowSubstitutions}
                matchOnly={filters.matchOnly} setMatchOnly={filters.setMatchOnly}
                scope={filters.scope} setScope={filters.setScope} 
                onClearFilters={filters.handleClearFilters}
            />

            {/* Grid */}
            {loading && page === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map((recipe: any) => (
                        <div 
                            key={recipe.slug} 
                            onClick={() => setSelectedRecipe(recipe)} 
                            className="cursor-pointer"
                        >
                            <RecipeCard recipe={recipe} initialFavorite={recipe.isFavorite || false} showStaples={filters.showStaples} allowSubstitutions={filters.allowSubstitutions}/>
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
                    <button onClick={filters.handleClearFilters} className="mt-6 text-orange-600 font-bold hover:underline">
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

            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={handleCloseModal} />}
            
            {!selectedRecipe && <FloatingAddButton />}
        </div>
    );
};

export default Discovery;
