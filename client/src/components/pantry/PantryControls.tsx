// client/src/components/pantry/PantryControls.tsx
import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import type { Ingredient } from '../../models/Recipe';

interface PantryControlsProps {
    taxonomy: any;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    filteredResults: Ingredient[];
    addToPantry: (ing: Ingredient) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
}

export const PantryControls: React.FC<PantryControlsProps> = ({
    taxonomy,
    searchTerm,
    setSearchTerm,
    filteredResults,
    addToPantry,
    filterCategory,
    setFilterCategory
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-50">
            {/* 1. Add to Pantry (Autocomplete) */}
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors text-base sm:text-lg font-medium shadow-sm"
                    placeholder="Search to add ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && filteredResults.length > 0 && (
                    <ul className="absolute mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl max-h-72 rounded-2xl py-2 overflow-auto focus:outline-none z-50">
                        {filteredResults.slice(0, 10).map((ing: any) => (
                            <li
                                key={ing.id}
                                onClick={() => addToPantry(ing)}
                                className="cursor-pointer select-none py-3 px-5 hover:bg-orange-50 dark:hover:bg-orange-500/15 flex justify-between items-center transition-colors group border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                            >
                                <span className="text-gray-700 dark:text-gray-300 font-bold group-hover:text-orange-600">
                                    {ing.name}
                                </span>
                                <Plus size={18} className="text-gray-300 group-hover:text-orange-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 2. Filter Pantry Categories */}
            <div className="relative w-full md:w-64 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Filter className="text-gray-400" size={18} />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="block w-full pl-11 pr-10 py-3.5 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors text-sm font-bold shadow-sm appearance-none cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {taxonomy?.ingredientCategories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="uncategorized">Other Essentials</option>
                </select>
                {/* Custom Dropdown Arrow */}
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                    ▼
                </div>
            </div>
        </div>
    );
};
