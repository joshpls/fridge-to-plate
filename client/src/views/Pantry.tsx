// src/pages/Pantry.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Refrigerator } from 'lucide-react';
import { refreshPantryCount } from '../utils/events';
import { taxonomyService } from '../services/taxonomyService';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

interface Ingredient {
    id: string;
    name: string;
    isStaple: boolean;
}

const Pantry = () => {
    const navigate = useNavigate();
    const { token, isAuthenticated } = useAuth();
    
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [myPantry, setMyPantry] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Use a ref to prevent auto-saving on the very first render
    const initialLoadDone = useRef(false);

    // 1. Fetch Data (Cached Ingredients + Live Pantry)
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
            return;
        }

        const loadInitialData = async () => {
            try {
                setLoading(true);

                // Instantly grab all ingredients from cache/API
                const taxonomy = await taxonomyService.getTaxonomy();
                if (taxonomy) {
                    setAllIngredients(taxonomy.ingredients);
                }

                // Fetch user's actual pantry
                const pantryRes = await fetchWithAuth(`${API_BASE}/pantry`);
                const pantryResult = await pantryRes.json();
                
                if (pantryResult.status === 'success') {
                    setMyPantry(pantryResult.data || []);
                }
            } catch (err) {
                console.error("Initialization failed:", err);
            } finally {
                setLoading(false);
                // Mark initial load as done so we can start watching for auto-saves
                setTimeout(() => { initialLoadDone.current = true; }, 500);
            }
        };

        loadInitialData();
    }, [isAuthenticated, token, navigate]);

    // 2. Auto-Save Logic
    // Whenever myPantry changes (after initial load), sync it to the database silently
    useEffect(() => {
        if (!initialLoadDone.current) return;

        const syncPantry = async () => {
            setIsSyncing(true);
            try {
                const ingredientIds = myPantry.map(ing => ing.id);
                await fetchWithAuth(`${API_BASE}/pantry`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ ingredientIds })
                });
                refreshPantryCount();
            } catch (err) {
                console.error("Failed to sync pantry:", err);
            } finally {
                setIsSyncing(false);
            }
        };

        // Debounce the save slightly so rapid clicking doesn't spam the API
        const timer = setTimeout(syncPantry, 800);
        return () => clearTimeout(timer);
    }, [myPantry, token]);

    // 3. Handlers
    const filteredResults = allIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !myPantry.some(p => p.id === ing.id)
    );

    const addToPantry = (ing: Ingredient) => {
        setMyPantry([...myPantry, ing]);
        setSearchTerm('');
    };

    const removeFromPantry = (id: string) => {
        setMyPantry(myPantry.filter(ing => ing.id !== id));
    };

    const handleFindRecipes = () => {
        navigate('/discovery', { state: { filterByPantry: true } });
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading your fridge...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24">
            <header className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <Refrigerator className="text-orange-500" size={32} />
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Virtual Fridge</h1>
                </div>
                <div className="text-sm font-bold text-gray-400">
                    {isSyncing ? 'Syncing...' : 'All changes saved ✓'}
                </div>
            </header>

            {/* Search Input */}
            <div className="relative z-20">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl leading-5 bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors text-lg font-medium shadow-sm"
                    placeholder="Search for eggs, spinach, pasta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Autocomplete Dropdown */}
                {searchTerm && filteredResults.length > 0 && (
                    <ul className="absolute mt-2 w-full bg-white border border-gray-100 shadow-2xl max-h-72 rounded-2xl py-2 overflow-auto focus:outline-none">
                        {filteredResults.slice(0, 10).map((ing) => (
                            <li
                                key={ing.id}
                                onClick={() => addToPantry(ing)}
                                className="cursor-pointer select-none relative py-3 px-5 hover:bg-orange-50 flex justify-between items-center transition-colors group border-b border-gray-50 last:border-0"
                            >
                                <span className="text-gray-700 font-bold group-hover:text-orange-700">
                                    {ing.name}
                                </span>
                                <Plus size={18} className="text-gray-300 group-hover:text-orange-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Current Pantry Display */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                    <span>Currently in Stock</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{myPantry.length} items</span>
                </h2>
                
                <div className="flex flex-wrap gap-2.5">
                    {myPantry.length === 0 ? (
                        <div className="text-center w-full py-10">
                            <span className="text-4xl mb-3 block">🧊</span>
                            <p className="text-gray-400 font-medium">Your fridge is empty. Start typing above to add ingredients!</p>
                        </div>
                    ) : (
                        myPantry.map((ing) => (
                            <span
                                key={ing.id}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-900 border border-orange-100 font-bold text-sm animate-in fade-in zoom-in duration-200 group"
                            >
                                {ing.name}
                                <button
                                    onClick={() => removeFromPantry(ing.id)}
                                    className="bg-orange-100/50 hover:bg-orange-200 text-orange-600 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    )}
                </div>
            </section>

            {/* Action Buttons */}
            {myPantry.length > 0 && (
                <div className="pt-4">
                    <button
                        onClick={handleFindRecipes}
                        className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest"
                    >
                        Find Recipes I Can Make
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pantry;
