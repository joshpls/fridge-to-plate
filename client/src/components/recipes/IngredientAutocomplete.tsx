import { useState, useRef, useEffect, useMemo } from 'react';
import type { Ingredient } from '../../models/Recipe';

interface Props {
    value: string;
    ingredients: Ingredient[];
    onChange: (id: string) => void;
    searchValue?: string; 
    onSearchChange?: (val: string) => void;
}

export const IngredientAutocomplete = ({ 
    value, 
    ingredients, 
    onChange,
    searchValue,
    onSearchChange 
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Determine the baseline name if editing an existing entry
    const initialName = ingredients.find(i => i.id === value)?.name || '';
    
    // Internal fallback text state if the parent doesn't provide controlled props
    const [internalSearchTerm, setInternalSearchTerm] = useState(initialName);
    
    // Derive active search value based on whether parent is controlling it
    const isControlled = searchValue !== undefined && onSearchChange !== undefined;
    const currentSearchTerm = isControlled ? searchValue : internalSearchTerm;

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync input when the selected value shifts or rehydrates externally
    useEffect(() => {
        const selectedIngredient = ingredients.find(i => i.id === value);
        if (selectedIngredient) {
            if (isControlled) onSearchChange(selectedIngredient.name);
            else setInternalSearchTerm(selectedIngredient.name);
        } else if (!value) {
            // Clear input text if the actual ID row resets or clears out
            if (!isControlled) setInternalSearchTerm('');
        }
    }, [value, ingredients, isControlled]);

    // Close dropdown when clicking outside the component viewport wrapper
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Revert text to match the active underlying selection if they click away
                const currentSelection = ingredients.find(i => i.id === value);
                if (currentSelection) {
                    if (isControlled) onSearchChange(currentSelection.name);
                    else setInternalSearchTerm(currentSelection.name);
                } else {
                    if (isControlled) onSearchChange('');
                    else setInternalSearchTerm('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, ingredients, isControlled, onSearchChange]);

    // High-performance filter: strictly limits DOM nodes to 50 max
    const filteredIngredients = useMemo(() => {
        if (!currentSearchTerm.trim()) return ingredients.slice(0, 50);
        
        const lowerSearch = currentSearchTerm.toLowerCase();
        return ingredients
            .filter(ing => ing.name.toLowerCase().includes(lowerSearch))
            .slice(0, 50);
    }, [currentSearchTerm, ingredients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isControlled) {
            onSearchChange(val);
        } else {
            setInternalSearchTerm(val);
        }
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={currentSearchTerm}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder="Search ingredient..."
                className="w-full p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent focus:border-orange-300 outline-none font-bold text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
            
            {/* The Dropdown Menu */}
            {isOpen && (
                <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800/50 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                    {filteredIngredients.length > 0 ? (
                        filteredIngredients.map(ing => (
                            <li
                                key={ing.id}
                                onClick={() => {
                                    onChange(ing.id);
                                    if (isControlled) onSearchChange(ing.name);
                                    else setInternalSearchTerm(ing.name);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-500/15 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-50 dark:border-gray-800/40 last:border-0"
                            >
                                {ing.name}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-sm font-medium text-gray-400 text-center italic dark:text-gray-500">
                            No ingredients found.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};
