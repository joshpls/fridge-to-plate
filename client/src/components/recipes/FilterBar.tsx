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
    scope, setScope
}: FilterBarProps) => {
    const [isExpanded, setIsExpanded] = useState(() => (matchOnly || showStaples || !allowSubstitutions || favoritesOnly ||
        selectedTags.length > 0 || includeIngredients.length > 0 ||
        excludeIngredients.length > 0 || selectedSubcategory !== ''));
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
                            setSelectedSubcategory(''); // Reset sub on category change
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
                            isExpanded ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-100 dark:border-gray-800/50 hover:border-gray-300'
                        }`}
                    >
                        {isExpanded ? 'Hide Filters' : 'More Filters ⚙️'}
                    </button>
                </div>
            </div>

            {/* Expanded Advanced Filters */}
            {isExpanded && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">

                    {/* Subcategories & Toggles */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-4 items-center bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                        
                        {selectedCategory && (
                            <select
                                value={selectedSubcategory}
                                onChange={(e) => setSelectedSubcategory(e.target.value)}
                                className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-semibold outline-none w-full sm:w-auto truncate"
                            >
                                <option value="">All Subcategories</option>
                                {availableSubcategories.map((sub: any) => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        )}

                        {isAuthenticated &&
                            <>
                            <button
                                onClick={() => setMatchOnly?.(!matchOnly)}
                                className={`col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap ${matchOnly ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 shadow-md border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {matchOnly ? '🎯 100% Matches' : '🎯 All Matches'}
                            </button>
                                <button
                                    onClick={() => setFavoritesOnly(!favoritesOnly)}
                                    className={`col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap ${favoritesOnly ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 shadow-md border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {favoritesOnly ? '❤️ Favorites' : '🤍 Show All'}
                                </button>

                                <button
                                    onClick={() => setShowStaples(!showStaples)}
                                    className={`col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap ${!showStaples ? 'bg-gray-800 dark:bg-orange-500/20 text-white dark:text-orange-400 shadow-md border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-700'
                                        }`}
                                >
                                    {!showStaples ? '🙈 No Staples' : '👀 Staples'}
                                </button>
                            <button
                                onClick={() => setAllowSubstitutions(!allowSubstitutions)}
                                className={`col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-all whitespace-nowrap ${allowSubstitutions
                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-md border-transparent'
                                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-700'
                                    }`}
                            >
                                {allowSubstitutions ? '💡 Smart Subs: ON' : '🚫 Exact Match'}
                            </button>
                            </>
                        }

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-700 flex justify-center items-center gap-1.5 whitespace-nowrap"
                        >
                            Sort A-Z {sortOrder === 'asc' ? '⬇️' : '⬆️'}
                        </button>

                        <button
                            onClick={onClearFilters}
                            className="col-span-1 w-full sm:w-auto px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-50 dark:bg-gray-900 text-red-600 dark:text-red-500 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-700  flex justify-center items-center gap-1.5 transition-all whitespace-nowrap"
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
