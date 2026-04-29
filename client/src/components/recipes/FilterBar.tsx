import React, { useState } from 'react';
import type { FilterBarProps } from '../../models/Utils';
import { useAuth } from '../../context/AuthContext';

export const FilterBar = ({
    taxonomy,
    searchInput, setSearchInput, onExecuteSearch,
    selectedCategory, setSelectedCategory,
    selectedSubcategory, setSelectedSubcategory,
    selectedTags, toggleTag,
    includeIngredients, setIncludeIngredients,
    excludeIngredients, setExcludeIngredients,
    favoritesOnly, setFavoritesOnly,
    sortOrder, setSortOrder,
    showStaples, setShowStaples,
    allowSubstitutions, setAllowSubstitutions,
    onClearFilters,
    matchOnly, setMatchOnly,
    scope, setScope,
    minRating, setMinRating,
    maxTime, setMaxTime
}: FilterBarProps) => {
    
    // Automatically expand if any advanced filters are active
    const [isExpanded, setIsExpanded] = useState(() => (
        matchOnly || showStaples || !allowSubstitutions || favoritesOnly ||
        selectedTags.length > 0 || includeIngredients.length > 0 ||
        excludeIngredients.length > 0 || selectedSubcategory !== '' ||
        minRating !== '' || maxTime !== ''
    ));
    
    const { isAuthenticated } = useAuth();

    const availableSubcategories = taxonomy?.categories?.find(
        (cat: any) => cat.id === selectedCategory
    )?.subcategories || [];

    const handleAddIngredient = (type: 'include' | 'exclude', e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) return;

        if (type === 'include' && !includeIngredients.includes(val)) {
            setIncludeIngredients([...includeIngredients, val]);
        } else if (type === 'exclude' && !excludeIngredients.includes(val)) {
            setExcludeIngredients([...excludeIngredients, val]);
        }
        e.target.value = '';
    };

    const removeIngredient = (type: 'include' | 'exclude', id: string) => {
        if (type === 'include') {
            setIncludeIngredients(includeIngredients.filter(ingId => ingId !== id));
        } else {
            setExcludeIngredients(excludeIngredients.filter(ingId => ingId !== id));
        }
    };

    const getIngredientName = (id: string) => taxonomy?.ingredients?.find((i: any) => i.id === id)?.name || 'Unknown';

    return (
        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-md z-20 shadow-sm rounded-3xl p-4 md:p-6 mb-8 border border-gray-100 dark:border-gray-800/50">
            
            {/* Search & Primary Filters */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 flex w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by recipe name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
                        className="w-full pl-12 pr-4 py-3 md:py-4 rounded-l-2xl border-2 border-r-0 border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 outline-none transition-all text-sm md:text-base"
                    />
                    <button 
                        onClick={onExecuteSearch}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 font-bold rounded-r-2xl transition-colors text-sm md:text-base whitespace-nowrap"
                    >
                        Search
                    </button>
                </div>

                {/* Category & Toggle Button */}
                <div className="grid grid-cols-2 sm:flex gap-2 w-full lg:w-auto">
                    {isAuthenticated && setScope && (
                        <select
                            value={scope || 'all'}
                            onChange={(e) => setScope(e.target.value as 'all' | 'household' | 'mine')}
                            className="w-full sm:w-48 p-3 md:p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="all">🌍 All Recipes</option>
                            <option value="household">🏠 Household Only</option>
                            <option value="mine">👤 My Recipes</option>
                        </select>
                    )}
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubcategory(''); 
                        }}
                        className="w-full sm:w-48 p-3 md:p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer text-sm md:text-base truncate"
                    >
                        <option value="">All Categories</option>
                        {taxonomy?.categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`w-full sm:w-auto p-3 md:p-4 rounded-2xl border-2 transition-all font-bold text-sm md:text-base whitespace-nowrap flex items-center justify-center gap-2 ${
                            isExpanded ? 'bg-gray-900 dark:bg-orange-500/20 text-white dark:text-orange-400 border-gray-900 dark:border-orange-500/30 hover:border-gray-300 dark:hover:bg-orange-600/30 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-100 dark:border-gray-800/50 hover:border-gray-300 dark:hover:bg-gray-800'
                        }`}
                    >
                        {isExpanded ? 'Hide Filters ⚙️' : 'More Filters ⚙️'}
                    </button>
                </div>
            </div>

            {/* Expanded Advanced Filters */}
            {isExpanded && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">

                    {/* Filter Action Row */}
                    <div className="flex flex-wrap gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 md:p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                    {selectedCategory && (
                        <select
                            value={selectedSubcategory}
                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                            className="flex-1 min-w-[140px] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold outline-none truncate text-gray-700 dark:text-gray-300 focus:border-orange-500 transition-colors"
                        >
                            <option value="">All Subcategories</option>
                            {availableSubcategories.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    )}

                    <select
                        value={maxTime}
                        onChange={(e) => setMaxTime(e.target.value)}
                        className="flex-1 min-w-[140px] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold outline-none truncate text-gray-700 dark:text-gray-300 focus:border-orange-500 transition-colors"
                    >
                        <option value="">⏱️ Any Time</option>
                        <option value="15">Under 15m</option>
                        <option value="30">Under 30m</option>
                        <option value="45">Under 45m</option>
                        <option value="60">Under 1 Hour</option>
                        <option value="90">Under 1.5 Hours</option>
                    </select>

                    <select
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        className="flex-1 min-w-[140px] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold outline-none truncate text-gray-700 dark:text-gray-300 focus:border-orange-500 transition-colors"
                    >
                        <option value="">⭐️ Any Rating</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                    </select>

                    <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="flex-1 min-w-[140px] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold outline-none truncate text-gray-700 dark:text-gray-300 focus:border-orange-500 transition-colors"
                        >
                            {isAuthenticated && <option value="match">Sort: Best Match</option>}
                            <option value="rating_desc">Sort: Highest Rated</option>
                            <option value="rating_asc">Sort: Lowest Rated</option>
                            <option value="asc">Sort: A-Z</option>
                            <option value="desc">Sort: Z-A</option>
                        </select>
                </div>
                
                <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setMatchOnly?.(!matchOnly)}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap border ${matchOnly ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {matchOnly ? '🎯 100% Matches' : '🎯 All Matches'}
                            </button>

                            <button
                                onClick={() => setFavoritesOnly(!favoritesOnly)}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap border ${favoritesOnly ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {favoritesOnly ? '❤️ Favorites' : '🤍 Show All'}
                            </button>

                            <button
                                onClick={() => setShowStaples(!showStaples)}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap border ${!showStaples ? 'bg-gray-800 dark:bg-orange-500/20 text-white dark:text-orange-400 border-transparent dark:border-orange-500/30 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-800'
                                    }`}
                            >
                                {!showStaples ? '🙈 No Staples' : '👀 Staples'}
                            </button>

                            <button
                                onClick={() => setAllowSubstitutions(!allowSubstitutions)}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap border ${allowSubstitutions
                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-sm'
                                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-800'
                                    }`}
                            >
                                {allowSubstitutions ? '💡 Smart Subs: ON' : '🚫 Exact Match'}
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:block w-full md:w-auto"></div>
                    )}

                    <button
                        onClick={onClearFilters}
                        className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 hover:dark:bg-red-500/30 flex justify-center items-center gap-2 transition-all whitespace-nowrap shrink-0 md:ml-auto"
                    >
                        ✕ Clear Filters
                    </button>
                </div>

                    {/* Ingredient Inclusion/Exclusion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Include */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Must Include Ingredients</label>
                            <select
                                onChange={(e) => handleAddIngredient('include', e)}
                                defaultValue=""
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm mb-2 outline-none"
                            >
                                <option value="" disabled>+ Add an ingredient...</option>
                                {taxonomy?.ingredients?.map((ing: any) => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                                {includeIngredients.map(id => (
                                    <span key={id} className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        ✓ {getIngredientName(id)}
                                        <button onClick={() => removeIngredient('include', id)} className="text-green-600 hover:text-green-900 font-black">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Exclude */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Must Exclude Ingredients</label>
                            <select
                                onChange={(e) => handleAddIngredient('exclude', e)}
                                defaultValue=""
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm mb-2 outline-none"
                            >
                                <option value="" disabled>+ Add an ingredient...</option>
                                {taxonomy?.ingredients?.map((ing: any) => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                                {excludeIngredients.map(id => (
                                    <span key={id} className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        🚫 {getIngredientName(id)}
                                        <button onClick={() => removeIngredient('exclude', id)} className="text-red-600 hover:text-red-900 font-black">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Required Tags (AND)</label>
                        <div className="flex flex-wrap gap-2">
                            {taxonomy?.tags?.map((tag: any) => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedTags.includes(tag.id)
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-400'
                                        }`}
                                >
                                    {tag.code} {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
