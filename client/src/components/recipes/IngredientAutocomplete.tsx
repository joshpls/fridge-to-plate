import { useState, useRef, useEffect, useMemo } from 'react';
import type { Ingredient } from '../../models/Recipe';

interface Props {
    value: string; // The ingredientId
    ingredients: Ingredient[];
    onChange: (id: string) => void;
}

export const IngredientAutocomplete = ({ value, ingredients, onChange }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    // Find initial name if editing an existing recipe
    const initialName = ingredients.find(i => i.id === value)?.name || '';
    const [searchTerm, setSearchTerm] = useState(initialName);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // If they clicked away without selecting, revert text to current selected value
                const currentSelection = ingredients.find(i => i.id === value);
                if (currentSelection) setSearchTerm(currentSelection.name);
                else setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, ingredients]);

    // High-performance filter: strictly limits DOM nodes to 50 max
    const filteredIngredients = useMemo(() => {
        if (!searchTerm) return ingredients.slice(0, 50);
        
        const lowerTerm = searchTerm.toLowerCase();
        return ingredients
            .filter(i => i.name.toLowerCase().includes(lowerTerm))
            .slice(0, 50);
    }, [searchTerm, ingredients]);

    return (
        <div ref={wrapperRef} className="relative flex-1">
            <input
                type="text"
                required
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    // Clear the actual parent value if they start altering the text
                    if (value) onChange(''); 
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search ingredient..."
                className="w-full p-3 bg-transparent outline-none font-bold text-gray-700 dark:text-gray-300 placeholder-gray-400"
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
                                    setSearchTerm(ing.name);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-orange-50 dark:bg-orange-500/15 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-50 last:border-0"
                            >
                                {ing.name}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-sm font-medium text-gray-400 text-center italic">
                            No ingredients found.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};
