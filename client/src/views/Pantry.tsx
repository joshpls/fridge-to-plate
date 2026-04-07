// src/pages/Pantry.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Refrigerator, Trash2 } from 'lucide-react';
import { refreshPantryCount } from '../utils/events';
import { taxonomyService } from '../services/taxonomyService';
import { pantryService } from '../services/pantryService';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import type { Ingredient } from '../models/Recipe';
import { useConfirm } from '../context/ConfirmContext';

const Pantry = () => {
    const navigate = useNavigate();
    const { confirm } = useConfirm();
    const { token, isAuthenticated } = useAuth();
    
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [myPantry, setMyPantry] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const initialLoadDone = useRef(false);

    // Fetch Data
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
            return;
        }

        const loadInitialData = async () => {
            try {
                setLoading(true);

                const taxonomy = await taxonomyService.getTaxonomy();
                if (taxonomy) {
                    setAllIngredients(taxonomy.ingredients);
                }

                const pantryData = await pantryService.getPantry();
                if (pantryData) {
                    setMyPantry(pantryData);
                }
            } catch (err) {
                console.error("Initialization failed:", err);
            } finally {
                setLoading(false);
                setTimeout(() => { initialLoadDone.current = true; }, 500);
            }
        };

        loadInitialData();
    }, [isAuthenticated, token, navigate]);

    // Auto-Sync Data
    useEffect(() => {
        if (!initialLoadDone.current) return;

        const syncPantry = async () => {
            setIsSyncing(true);
            try {
                const ingredientIds = myPantry.map(ing => ing.id);
                await fetchWithAuth(`${API_BASE}/pantry`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ingredientIds })
                });
                
                pantryService.optimisticUpdate(myPantry);
                refreshPantryCount();
            } catch (err) {
                console.error("Failed to sync pantry:", err);
            } finally {
                setIsSyncing(false);
            }
        };

        const timer = setTimeout(syncPantry, 800);
        return () => clearTimeout(timer);
    }, [myPantry, token]);

    const filteredResults = allIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !myPantry.some(p => p.id === ing.id)
    );

    const addToPantry = (ing: Ingredient) => {
        setMyPantry(prev => [...prev, ing]);
        setSearchTerm('');
    };

    const removeFromPantry = (id: string) => {
        setMyPantry(prev => prev.filter(ing => ing.id !== id));
    };

    const clearPantry = async() => {
        const isConfirmed = await confirm({
            title: "Clear Pantry?",
            message: "Are you sure you want to empty your entire fridge?",
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;
        setMyPantry([]);

    };

    const handleFindRecipes = () => {
        navigate('/discovery', { state: { filterByPantry: true } });
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading your fridge...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24">
            <header className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-4">
                <div className="flex items-center gap-3">
                    <Refrigerator className="text-orange-500" size={32} />
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Virtual Fridge</h1>
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
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 dark:border-gray-800/50 rounded-2xl leading-5 bg-white dark:bg-gray-900 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors text-lg font-medium shadow-sm"
                    placeholder="Search for eggs, spinach, pasta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && filteredResults.length > 0 && (
                    <ul className="absolute mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 shadow-2xl max-h-72 rounded-2xl py-2 overflow-auto focus:outline-none">
                        {filteredResults.slice(0, 10).map((ing) => (
                            <li
                                key={ing.id}
                                onClick={() => addToPantry(ing)}
                                className="cursor-pointer select-none relative py-3 px-5 hover:bg-orange-50 dark:bg-orange-500/15 flex justify-between items-center transition-colors group border-b border-gray-50 last:border-0"
                            >
                                <span className="text-gray-700 dark:text-gray-300 font-bold group-hover:text-orange-700">
                                    {ing.name}
                                </span>
                                <Plus size={18} className="text-gray-300 group-hover:text-orange-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Pantry Display */}
            <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/50 shadow-sm">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span>Currently in Stock</span>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">{myPantry.length} items</span>
                    </div>
                    
                    {myPantry.length > 0 && (
                        <button 
                            onClick={clearPantry}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                            <span>Clear All</span>
                        </button>
                    )}
                </h2>
                
                <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    {myPantry.length === 0 ? (
                        <p className="text-gray-400 font-bold m-auto">Your household pantry is empty.</p>
                    ) : (
                        myPantry.map((ing) => (
                            <span
                                key={ing.id}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-orange-900 dark:text-orange-200 border border-orange-100 dark:border-orange-900/50 font-bold text-sm animate-in fade-in zoom-in duration-200 group shadow-sm"
                            >
                                {ing.name}
                                {ing.addedBy && (
                                    <span className="text-[10px] uppercase tracking-wider opacity-60 ml-1 font-medium">
                                        ({ing.addedBy})
                                    </span>
                                )}
                                <button
                                    onClick={() => removeFromPantry(ing.id)}
                                    className="bg-orange-100/50 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 rounded-full p-0.5 transition-colors ml-1"
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
                        className="w-full bg-gray-900 dark:bg-orange-600 hover:bg-black dark:hover:bg-orange-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest"
                    >
                        Find Recipes I Can Make
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pantry;
