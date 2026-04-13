// client/src/views/Pantry.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Refrigerator, Trash2, ChevronDown, ChevronRight, Star, AlertTriangle, CalendarDays } from 'lucide-react';
import { refreshPantryCount } from '../utils/events';
import { taxonomyService } from '../services/taxonomyService';
import { pantryService } from '../services/pantryService';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { useConfirm } from '../context/ConfirmContext';
import { PantryControls } from '../components/pantry/PantryControls';
import toast from 'react-hot-toast';

interface PantryItemUI {
    ingredientId: string;
    name: string;
    categoryId: string | null;
    isDefaultStaple: boolean;
    isPersonalStaple: boolean;
    quantity: number | '';
    unitId: string;
    expiresAt: string; 
    addedBy?: string;
}

const Pantry = () => {
    const navigate = useNavigate();
    const { confirm } = useConfirm();
    const { token, isAuthenticated } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'all' | 'staples'>('all');
    const [taxonomy, setTaxonomy] = useState<any>(null);
    const [myPantry, setMyPantry] = useState<PantryItemUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Controls State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['expiring-soon']));

    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
            return;
        }

        const loadInitialData = async () => {
            try {
                setLoading(true);
                const tax = await taxonomyService.getTaxonomy();
                if (tax) setTaxonomy(tax);

                const pantryData = await pantryService.getPantry();
                if (pantryData && tax) {
                    const mappedItems: PantryItemUI[] = pantryData.items.map((item: any) => ({
                        ingredientId: item.ingredientId,
                        name: item.ingredient?.name || 'Unknown',
                        categoryId: item.ingredient?.categoryId || null,
                        isDefaultStaple: item.ingredient?.isDefaultStaple || false,
                        isPersonalStaple: pantryData.personalStapleIds.includes(item.ingredientId),
                        quantity: item.quantity || '',
                        unitId: item.unitId || '',
                        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '',
                        addedBy: item.addedBy?.alias || item.addedBy?.firstName || null
                    }));
                    setMyPantry(mappedItems);
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

    useEffect(() => {
        if (!initialLoadDone.current) return;

        const syncPantry = async () => {
            setIsSyncing(true);
            try {
                const itemsPayload = myPantry.map(item => ({
                    ingredientId: item.ingredientId,
                    quantity: item.quantity === '' ? null : item.quantity,
                    unitId: item.unitId || null,
                    expiresAt: item.expiresAt || null
                }));

                await fetchWithAuth(`${API_BASE}/pantry`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: itemsPayload })
                });

                const stapleIds = myPantry.filter(i => i.isPersonalStaple).map(i => i.ingredientId);

                const cacheItems = myPantry.map(item => ({
                    ingredientId: item.ingredientId,
                    quantity: item.quantity,
                    unitId: item.unitId,
                    expiresAt: item.expiresAt,
                    ingredient: {
                        name: item.name,
                        categoryId: item.categoryId,
                        isDefaultStaple: item.isDefaultStaple
                    },
                    addedBy: item.addedBy ? { alias: item.addedBy } : null
                }));

                pantryService.optimisticUpdate({ items: cacheItems, personalStapleIds: stapleIds });
                refreshPantryCount();
            } catch (err) {
                console.error("Failed to sync pantry:", err);
            } finally {
                setIsSyncing(false);
            }
        };

        const timer = setTimeout(syncPantry, 1000);
        return () => clearTimeout(timer);
    }, [myPantry, token]);

    // Search Results for Autocomplete
    const filteredResults = useMemo(() => {
        if (!taxonomy || !searchTerm) return [];
        return taxonomy.ingredients.filter((ing: any) =>
            ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !myPantry.some(p => p.ingredientId === ing.id)
        );
    }, [taxonomy, searchTerm, myPantry]);

    const expiringItems = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return myPantry.filter(item => {
            if (!item.expiresAt) return false;
            const expDate = new Date(item.expiresAt);
            return expDate <= nextWeek;
        }).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    }, [myPantry]);

    // Filter the pantry list before rendering categories based on the active tab
    const visiblePantryItems = useMemo(() => {
        if (activeTab === 'staples') {
            return myPantry.filter(item => item.isPersonalStaple || item.isDefaultStaple);
        }
        return myPantry;
    }, [myPantry, activeTab]);

    const groupedPantry = useMemo(() => {
        const groups: Record<string, PantryItemUI[]> = { 'uncategorized': [] };
        if (taxonomy?.ingredientCategories) {
            taxonomy.ingredientCategories.forEach((cat: any) => groups[cat.id] = []);
        }
        visiblePantryItems.forEach(item => {
            if (item.categoryId && groups[item.categoryId]) {
                groups[item.categoryId].push(item);
            } else {
                groups['uncategorized'].push(item);
            }
        });
        return groups;
    }, [visiblePantryItems, taxonomy]);

    // Apply the Category Filter to the visible accordions
    const visibleCategories = useMemo(() => {
        if (!taxonomy) return [];
        let cats = taxonomy.ingredientCategories.map((c: any) => ({ ...c, isUncategorized: false }));
        cats.push({ id: 'uncategorized', name: 'Other Essentials', isUncategorized: true });

        if (filterCategory) {
            cats = cats.filter((c: any) => c.id === filterCategory);
        }
        return cats;
    }, [taxonomy, filterCategory]);

    const addToPantry = (ing: any) => {
        const newItem: PantryItemUI = {
            ingredientId: ing.id,
            name: ing.name,
            categoryId: ing.categoryId,
            isDefaultStaple: ing.isDefaultStaple,
            isPersonalStaple: false,
            quantity: '',
            unitId: '',
            expiresAt: ''
        };
        setMyPantry(prev => [newItem, ...prev]);
        setSearchTerm('');
        if (ing.categoryId) toggleCategory(ing.categoryId, true);
    };

    const updateItem = (ingredientId: string, field: keyof PantryItemUI, value: any) => {
        setMyPantry(prev => prev.map(item => 
            item.ingredientId === ingredientId ? { ...item, [field]: value } : item
        ));
    };

    const removeFromPantry = (id: string) => setMyPantry(prev => prev.filter(ing => ing.ingredientId !== id));

    const clearPantry = async() => {
        const isConfirmed = await confirm({
            title: "Clear Pantry?",
            message: "Are you sure you want to empty your entire fridge? This cannot be undone.",
            confirmText: "Yes, dump it all",
            variant: "warning"
        });
        if (isConfirmed) setMyPantry([]);
    };

    const handleFindRecipes = (specificIngredients: string[] = []) => {
        navigate('/discovery', { state: { filterByPantry: true, includeIngredients: specificIngredients } });
    };

    const toggleCategory = (categoryId: string, forceExpand: boolean = false) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (forceExpand) next.add(categoryId);
            else next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
            return next;
        });
    };

    const handleToggleStaple = async (ingredientId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        setMyPantry(prev => prev.map(item =>
            item.ingredientId === ingredientId
                ? { ...item, isPersonalStaple: newStatus }
                : item
        ));

        try {
            await pantryService.togglePersonalStaple(ingredientId);
            toast.success(newStatus ? "Added to My Staples" : "Removed from My Staples");
        } catch (error) {
            // Revert on failure
            setMyPantry(prev => prev.map(item =>
                item.ingredientId === ingredientId
                    ? { ...item, isPersonalStaple: currentStatus }
                    : item
            ));
            toast.error("Failed to update staple status");
        }
    };

    if (loading || !taxonomy) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse">Loading your fridge...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 pb-32 animate-in fade-in">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <Refrigerator className="text-orange-500 shrink-0" size={32} />
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Virtual Fridge</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {myPantry.length} Items • {isSyncing ? 'Syncing...' : 'Saved ✓'}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {myPantry.length > 0 && (
                        <button 
                            onClick={clearPantry}
                            className="flex items-center justify-center gap-2 text-red-500 hover:text-white hover:bg-red-500 dark:bg-red-500/10 dark:hover:bg-red-500/80 px-4 py-2 rounded-xl transition-all font-bold text-sm w-full sm:w-auto"
                        >
                            <Trash2 size={16} /> <span className="sm:hidden">Clear</span>
                        </button>
                    )}
                    <button
                        onClick={() => handleFindRecipes()}
                        className="flex-1 sm:flex-none bg-gray-900 dark:bg-orange-600 hover:bg-black dark:hover:bg-orange-500 text-white font-black py-2 px-6 rounded-xl shadow-md transition-all active:scale-95 text-sm whitespace-nowrap"
                    >
                        Find Recipes
                    </button>
                </div>
            </header>

            {/* Expiring Widget */}
            {expiringItems.length > 0 && !filterCategory && (
                <section className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-black text-lg">
                            <AlertTriangle size={20} className="animate-pulse" />
                            <h2>Use It or Lose It</h2>
                        </div>
                        <button 
                            onClick={() => handleFindRecipes(expiringItems.map(i => i.ingredientId))}
                            className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                            Find Recipes to Rescue
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {expiringItems.map(item => {
                            const expDate = new Date(item.expiresAt);
                            const isExpired = expDate < new Date();
                            return (
                                <div key={`exp-${item.ingredientId}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border ${isExpired ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200'}`}>
                                    <span>{item.name}</span>
                                    <span className="text-[10px] uppercase tracking-widest opacity-80">
                                        ({isExpired ? 'Expired' : `${Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days left`})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Extracted Controls */}
            <PantryControls 
                taxonomy={taxonomy}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredResults={filteredResults}
                addToPantry={addToPantry}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
            />

            {/* --- Tab Navigation --- */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                        activeTab === 'all'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    All Items
                </button>
                <button
                    onClick={() => setActiveTab('staples')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'staples'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Star size={16} className={activeTab === 'staples' ? 'fill-orange-400 text-orange-400' : ''} />
                    My Staples
                </button>
            </div>

            {/* Categorized Pantry Display */}
            <section className="space-y-4">
                {visibleCategories.map((category: any) => {
                    const items = groupedPantry[category.id] || [];
                    if (items.length === 0) return null;
                    const isExpanded = expandedCategories.has(category.id);

                    return (
                        <div key={category.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                            <button 
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                                    <h3 className="font-black text-gray-800 dark:text-gray-200 text-lg">{category.name}</h3>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-md">{items.length}</span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-5 pb-5 space-y-3">
                                    {items.map(item => (
                                        <div key={item.ingredientId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            
                                            {/* Left: Star, Name, Mobile Trash */}
                                            <div className="flex justify-between items-start sm:items-center w-full sm:w-auto flex-1">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => handleToggleStaple(item.ingredientId, item.isPersonalStaple)}
                                                        disabled={item.isDefaultStaple}
                                                        title={item.isDefaultStaple ? "Global staple (always on)" : "Toggle personal staple"}
                                                        className={`p-1.5 rounded-full transition-colors ${item.isDefaultStaple ? 'bg-yellow-100 text-yellow-400 cursor-not-allowed dark:bg-yellow-900/30 dark:text-yellow-600' : item.isPersonalStaple ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/40' : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600'}`}
                                                    >
                                                        <Star size={16} className={item.isPersonalStaple || item.isDefaultStaple ? 'fill-current' : ''} />
                                                    </button>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                                        {item.name}
                                                        {item.addedBy && <span className="text-xs text-gray-400 ml-2 font-medium hidden md:inline">({item.addedBy})</span>}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeFromPantry(item.ingredientId)}
                                                    className="sm:hidden p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Right: Inputs Grid */}
                                            <div className="grid grid-cols-2 sm:flex items-end gap-3 w-full sm:w-auto">
                                                <div className="flex flex-col gap-1 w-full sm:w-20">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Qty</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.ingredientId, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-orange-500 text-gray-800 dark:text-gray-200"
                                                    />
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 w-full sm:w-28">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Unit</label>
                                                    <select 
                                                        value={item.unitId}
                                                        onChange={e => updateItem(item.ingredientId, 'unitId', e.target.value)}
                                                        className="w-full px-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-orange-500 text-gray-600 dark:text-gray-300"
                                                    >
                                                        <option value="">None</option>
                                                        {taxonomy.units.map((u: any) => (
                                                            <option key={u.id} value={u.id}>{u.abbreviation || u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 w-full sm:w-40 relative">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                                        Expires 
                                                        <span title="Optional. Set to be reminded before it spoils!" className="cursor-help bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full w-3 h-3 flex items-center justify-center text-[8px]">?</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                                            <CalendarDays size={14} className="text-gray-400" />
                                                        </div>
                                                        <input 
                                                            type="date" 
                                                            value={item.expiresAt}
                                                            onChange={e => updateItem(item.ingredientId, 'expiresAt', e.target.value)}
                                                            className="w-full pl-8 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-orange-500 text-gray-600 dark:text-gray-300"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeFromPantry(item.ingredientId)}
                                                    className="hidden sm:block p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors ml-1 shrink-0 mb-0.5"
                                                    title="Remove from pantry"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {visiblePantryItems.length === 0 && (
                     <div className="text-center py-12">
                         <p className="text-gray-500 dark:text-gray-400 font-medium">
                             {activeTab === 'staples' 
                                 ? "You haven't marked any personal staples yet. Click the star icon on any ingredient to add it!" 
                                 : "Your pantry is currently empty."}
                         </p>
                     </div>
                )}
            </section>
        </div>
    );
};

export default Pantry;
