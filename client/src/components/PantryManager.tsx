import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, X, Refrigerator } from 'lucide-react';

interface Ingredient {
    id: string;
    name: string;
    isStaple: boolean;
}

const PantryManager = () => {
    const [allIngredients, setAllIngredients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [myPantry, setMyPantry] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Data
    useEffect(() => {
    const controller = new AbortController();

    const loadInitialData = async () => {
        try {
            setLoading(true);
            
            // We can run these in parallel to speed up the "Kitchen" opening
            const [ingredientsRes, pantryRes] = await Promise.all([
                axios.get('/api/ingredients', { signal: controller.signal }),
                axios.get('/api/pantry', { signal: controller.signal })
            ]);

            // Drill into our standardized responseHandler structure (.data.data)
            setAllIngredients(ingredientsRes.data.data || []);
            setMyPantry(pantryRes.data.data || []);
            
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            console.error("Initialization failed:", err);
        } finally {
            setLoading(false);
        }
    };

    loadInitialData();

    return () => controller.abort();
}, []);

    // 2. Filter results based on search input
    const filteredResults = allIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !myPantry.find(p => p.id === ing.id)
    );

    const addToPantry = (ing: Ingredient) => {
        setMyPantry([...myPantry, ing]);
        setSearchTerm(''); // Clear search after adding
    };

    const removeFromPantry = (id: string) => {
        setMyPantry(myPantry.filter(ing => ing.id !== id));
    };

    const savePantryToDb = async () => {
        try {
            const ingredientIds = myPantry.map(ing => ing.id);
            await axios.post('http://localhost:5000/api/pantry', { ingredientIds });
            alert("Pantry synced successfully!");
        } catch (err) {
            console.error("Failed to sync pantry:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <header className="flex items-center gap-3 border-b pb-4">
                <Refrigerator className="text-emerald-600" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">My Virtual Fridge</h1>
            </header>

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-900" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Search for eggs, spinach, pasta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Autocomplete Dropdown */}
                {searchTerm && filteredResults.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 shadow-xl max-h-60 rounded-xl py-2 overflow-auto focus:outline-none sm:text-sm">
                        {filteredResults.slice(0, 5).map((ing) => (
                            <li
                                key={ing.id}
                                onClick={() => addToPantry(ing)}
                                className="cursor-pointer select-none relative py-3 px-4 hover:bg-emerald-50 flex justify-between items-center transition-colors group"
                            >
                                {/* Force black/gray text even if system is in dark mode */}
                                <span className="text-gray-900 font-medium group-hover:text-emerald-900">
                                    {ing.name}
                                </span>
                                <Plus size={16} className="text-emerald-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Current Pantry Display */}
            <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Currently in Stock ({myPantry.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                    {myPantry.length === 0 ? (
                        <p className="text-gray-400 italic">Your fridge is empty. Start adding ingredients!</p>
                    ) : (
                        myPantry.map((ing) => (
                            <span
                                key={ing.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-medium text-sm animate-in fade-in zoom-in duration-200"
                            >
                                {ing.name}
                                <button
                                    onClick={() => removeFromPantry(ing.id)}
                                    className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    )}
                </div>
            </section>

            {/* Action Button */}
            {myPantry.length > 0 && (
                <div className="flex gap-4">
                    <button
                        onClick={savePantryToDb}
                        className="flex-1 bg-white border-2 border-emerald-600 text-emerald-600 font-bold py-3 px-4 rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                        Save Pantry
                    </button>
                    <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95">
                        Find Recipes
                    </button>
                </div>
            )}
        </div>
    );
};

export default PantryManager;
