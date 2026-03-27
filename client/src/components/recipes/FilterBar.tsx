import React, { useState } from 'react';
import type { FilterBarProps } from '../../models/Utils';

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
    showStaples, setShowStaples
}: FilterBarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helpers to find the correct subcategories based on selected category
    const availableSubcategories = taxonomy?.categories?.find(
        (cat: any) => cat.id === selectedCategory
    )?.subcategories || [];

    // Helper for ingredient selection (Simple select implementation for now)
    const handleAddIngredient = (type: 'include' | 'exclude', e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) return;

        if (type === 'include' && !includeIngredients.includes(val)) {
            setIncludeIngredients([...includeIngredients, val]);
        } else if (type === 'exclude' && !excludeIngredients.includes(val)) {
            setExcludeIngredients([...excludeIngredients, val]);
        }
        e.target.value = ''; // Reset select
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
        <div className="bg-white/95 backdrop-blur-md z-20 shadow-sm rounded-3xl p-6 mb-8 border border-gray-100">
            {/* Top Row: Search & Primary Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1 flex">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by recipe name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
                        className="w-full pl-12 pr-4 py-4 rounded-l-2xl border-2 border-r-0 border-gray-100 focus:border-orange-500 outline-none transition-all"
                    />
                    <button
                        onClick={onExecuteSearch}
                        className="bg-orange-500 text-white px-6 font-bold rounded-r-2xl hover:bg-orange-600 transition-colors"
                    >
                        Search
                    </button>
                </div>

                <div className="flex gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubcategory(''); // Reset sub on category change
                        }}
                        className="p-4 rounded-2xl border-2 border-gray-100 bg-white font-bold text-gray-700 outline-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {taxonomy?.categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-4 rounded-2xl border-2 transition-all font-bold ${isExpanded ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'}`}
                    >
                        {isExpanded ? 'Hide Filters' : 'More Filters ⚙️'}
                    </button>
                </div>
            </div>

            {/* Expanded Advanced Filters */}
            {isExpanded && (
                <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">

                    {/* Row 1: Subcategories & Toggles */}
                    <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {selectedCategory && (
                            <select
                                value={selectedSubcategory}
                                onChange={(e) => setSelectedSubcategory(e.target.value)}
                                className="p-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold outline-none"
                            >
                                <option value="">All Subcategories</option>
                                {availableSubcategories.map((sub: any) => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        )}

                        <button
                            onClick={() => setFavoritesOnly(!favoritesOnly)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${favoritesOnly ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {favoritesOnly ? '❤️ Favorites Only' : '🤍 Show All'}
                        </button>

                        <button
                            onClick={() => setShowStaples(!showStaples)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${!showStaples ? 'bg-gray-800 text-white shadow-md border-transparent' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {!showStaples ? '🙈 Hiding Staples' : '👀 Showing Staples'}
                        </button>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                        >
                            Sort A-Z {sortOrder === 'asc' ? '⬇️' : '⬆️'}
                        </button>
                    </div>

                    {/* Row 2: Ingredient Inclusion/Exclusion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Include */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Must Include Ingredients</label>
                            <select
                                onChange={(e) => handleAddIngredient('include', e)}
                                defaultValue=""
                                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm mb-2 outline-none"
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
                                        <button onClick={() => removeIngredient('include', id)} className="text-green-600 hover:text-green-900">✕</button>
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
                                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm mb-2 outline-none"
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
                                        <button onClick={() => removeIngredient('exclude', id)} className="text-red-600 hover:text-red-900">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Tags */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Required Tags (AND)</label>
                        <div className="flex flex-wrap gap-2">
                            {taxonomy?.tags?.map((tag: any) => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedTags.includes(tag.id)
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
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
