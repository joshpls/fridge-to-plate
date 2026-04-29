// client/src/hooks/useDiscoveryFilters.ts
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const CACHE_KEY = 'f2p_discovery_filters';

export const useDiscoveryFilters = () => {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Load initial cache once, synchronously
    const cachedFilters = useMemo(() => {
        return storageService.cache.get<any>(CACHE_KEY) || {};
    }, []);

    // Transient Search State
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 

    // Cached Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>(cachedFilters.selectedCategory ?? '');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>(cachedFilters.selectedSubcategory ?? '');
    const [selectedTags, setSelectedTags] = useState<string[]>(cachedFilters.selectedTags ?? []);
    
    // location.state overrides cache for these specific keys
    const [includeIngredients, setIncludeIngredients] = useState<string[]>(location.state?.includeIngredients || cachedFilters.includeIngredients || []);
    const [excludeIngredients, setExcludeIngredients] = useState<string[]>(cachedFilters.excludeIngredients ?? []);
    const [matchOnly, setMatchOnly] = useState<boolean>(location.state?.filterByPantry ?? cachedFilters.matchOnly ?? false);
    
    // Toggles
    const [favoritesOnly, setFavoritesOnly] = useState<boolean>(cachedFilters.favoritesOnly ?? false);
    const [showStaples, setShowStaples] = useState<boolean>(cachedFilters.showStaples ?? false);
    const [allowSubstitutions, setAllowSubstitutions] = useState<boolean>(cachedFilters.allowSubstitutions ?? true);
    const [sortOrder, setSortOrder] = useState<string>(cachedFilters.sortOrder ?? (isAuthenticated ? 'match' : 'asc'));
    const [scope, setScope] = useState<'all' | 'household' | 'mine'>(cachedFilters.scope ?? 'all');

    const [minRating, setMinRating] = useState<string>(cachedFilters.minRating ?? '');
    const [maxTime, setMaxTime] = useState<string>(cachedFilters.maxTime ?? '');
    
    // Save to Cache Whenever Filters Change
    useEffect(() => {
        const filtersToCache = {
            selectedCategory, selectedSubcategory, selectedTags,
            includeIngredients, excludeIngredients, favoritesOnly,
            showStaples, allowSubstitutions, sortOrder, scope, matchOnly,
            minRating, maxTime
        };
        storageService.cache.set(CACHE_KEY, filtersToCache);
    }, [
        selectedCategory, selectedSubcategory, selectedTags, 
        includeIngredients, excludeIngredients, favoritesOnly, 
        showStaples, allowSubstitutions, sortOrder, scope, matchOnly,
        minRating, maxTime
    ]);

    // Helpers
    const handleExecuteSearch = () => setSearchQuery(searchInput);
    
    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    const handleClearFilters = () => {
        setSearchInput(''); setSearchQuery(''); 
        setSelectedCategory(''); setSelectedSubcategory('');
        setSelectedTags([]); setIncludeIngredients([]); setExcludeIngredients([]); 
        setFavoritesOnly(false); setShowStaples(false); 
        setAllowSubstitutions(true); setSortOrder(isAuthenticated ? 'match' : 'asc'); 
        setMatchOnly(false); setScope('all');
        setMinRating(''); setMaxTime('')
    };

    return {
        searchInput, setSearchInput,
        searchQuery, setSearchQuery, handleExecuteSearch,
        selectedCategory, setSelectedCategory,
        selectedSubcategory, setSelectedSubcategory,
        selectedTags, toggleTag,
        includeIngredients, setIncludeIngredients,
        excludeIngredients, setExcludeIngredients,
        favoritesOnly, setFavoritesOnly,
        showStaples, setShowStaples,
        allowSubstitutions, setAllowSubstitutions,
        sortOrder, setSortOrder,
        scope, setScope,
        matchOnly, setMatchOnly,
        minRating, setMinRating,
        maxTime, setMaxTime,
        handleClearFilters
    };
};