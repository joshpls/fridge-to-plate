// src/views/ShoppingList.tsx
import { useEffect, useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import type { ShoppingListItem, Ingredient } from '../models/Recipe';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { X, Printer, Search, Plus, Check, Edit2 } from 'lucide-react'; 
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { useConfirm } from '../context/ConfirmContext';
import { pantryService } from '../services/pantryService';
import { refreshPantryCount } from '../utils/events';
import { taxonomyService } from '../services/taxonomyService';
import { QuantityInput } from '../components/recipes/QuantityInput';

const ShoppingList = () => {
    const { confirm } = useConfirm();
    const { token } = useAuth();
    
    // --- Data States ---
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [taxonomy, setTaxonomy] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // --- Search & Edit States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [editForm, setEditForm] = useState({ quantity: '1', unitId: '' });

    const loadLocalList = () => {
        setItems(storageService.shopping.get());
    };

    const fetchTaxonomy = async () => {
        const [tax] = await Promise.all([
            taxonomyService.getTaxonomy(),
            pantryService.getPantry()
        ]);

        if (tax) setTaxonomy(tax);
    };

    useEffect(() => {
        loadLocalList();
        fetchTaxonomy();
        window.addEventListener('shoppingListUpdated', loadLocalList);
        return () => window.removeEventListener('shoppingListUpdated', loadLocalList);
    }, []);

    const filteredResults = useMemo(() => {
        if (!searchTerm || !taxonomy?.ingredients) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return taxonomy.ingredients.filter((ing: Ingredient) => 
            ing.name.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, taxonomy]);

    const handleRemoveItem = (e: React.MouseEvent, ingredientId: string) => {
        e.stopPropagation();
        storageService.shopping.removeItem(ingredientId);
        toast.success("Item removed");
    };

    const handleClearList = async () => {
        const isConfirmed = await confirm({
            title: "Clear the Shopping List?",
            message: "Are you sure you want to clear your list?",
            confirmText: "Yes",
            variant: "info"
        });
        if (!isConfirmed) return;
        storageService.shopping.clear();
        toast.success("List Cleared");
    };

    const handlePrint = () => window.print();

    const startEdit = (e: React.MouseEvent, item: ShoppingListItem) => {
        e.stopPropagation();
        // Load existing quantity and unitId into the form
        setEditForm({ 
            quantity: String(item.quantity), 
            unitId: item.unitId || '' 
        });
        setEditingId(item.ingredientId);
    };

    const saveEdit = (e: React.MouseEvent, item: ShoppingListItem) => {
        e.stopPropagation();
        
        // Find the unit abbreviation from taxonomy to keep the display name updated
        const selectedUnit = taxonomy?.units?.find((u: any) => u.id === editForm.unitId);
        
        storageService.shopping.updateItem({
            ...item,
            quantity: editForm.quantity,
            unitId: editForm.unitId,
            unit: selectedUnit ? (selectedUnit.abbreviation || selectedUnit.name) : item.unit
        });
        setEditingId(null);
    };

    const handleAddFromSearch = (ing: Ingredient) => {
        const existing = items.find(i => i.ingredientId === ing.id);
        
        const newItem: ShoppingListItem = existing ? existing : {
            ingredientId: ing.id,
            name: ing.name,
            quantity: '1',
            unit: 'unit',
            unitId: '',
            bought: false
        };

        storageService.shopping.updateItem(newItem);
        setSearchTerm('');
        setEditForm({ quantity: newItem.quantity, unitId: newItem.unitId || '' });
        setEditingId(newItem.ingredientId);
    };

    const handleToggleBought = (ingredientId: string) => {
        if (editingId) return; // Prevent toggling while editing
        
        // This updates the local storage and triggers the 'shoppingListUpdated' event
        storageService.shopping.toggleBought(ingredientId);
    };

    const buyAll = async () => {
        if (!token) return toast.error("You must be logged in to update your pantry.");
        
        // Use the full list from storage to match your old behavior
        const list = storageService.shopping.get();
        
        if (list.length === 0) {
            toast.error("Your shopping list is empty");
            return;
        }

        setIsSyncing(true);
        try {
            // We send the whole list to the bulk pantry endpoint[cite: 1]
            const res = await fetchWithAuth(`${API_BASE}/pantry/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: list }) 
            });

            const result = await res.json();

            if (result.status === 'success') {
                toast.success("Pantry successfully stocked!");

                // Clear the local shopping list after successful sync
                storageService.shopping.clear();

                // Refresh the pantry data and badge count
                await pantryService.getPantry(true);
                refreshPantryCount();
            } else {
                toast.error(result.message || "Failed to stock pantry");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error while syncing to pantry");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24 print:p-0 print:m-0 print:space-y-4">
            <header className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-4 print:border-b-2 print:border-black">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight print:text-4xl">Shopping List</h1>
                    <p className="hidden print:block text-gray-500 dark:text-gray-400 font-bold mt-1">
                        {new Date().toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-4 items-center print:hidden">
                    {items.length > 0 && (
                        <>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white text-gray-700 dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                                <Printer size={16} /> Print
                            </button>
                            <button onClick={handleClearList} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white text-gray-700 dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-colors">
                                Clear All
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="relative z-50 print:hidden">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors text-base sm:text-lg font-medium shadow-sm"
                    placeholder="Search to add extra ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && filteredResults.length > 0 && (
                    <ul className="absolute mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl max-h-72 rounded-2xl py-2 overflow-auto focus:outline-none">
                        {filteredResults.slice(0, 10).map((ing: Ingredient) => (
                            <li
                                key={ing.id}
                                onClick={() => handleAddFromSearch(ing)}
                                className="cursor-pointer select-none py-3 px-5 hover:bg-orange-50 dark:hover:bg-orange-500/15 flex justify-between items-center transition-colors group border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                            >
                                <span className="text-gray-700 dark:text-gray-300 font-bold group-hover:text-orange-600">{ing.name}</span>
                                <Plus size={18} className="text-gray-300 group-hover:text-orange-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 print:hidden">
                    <span className="text-4xl mb-3 block">🛒</span>
                    <p className="text-gray-400 dark:text-white font-medium">Your cart is empty.</p>
                </div>
            ) : (
                <div className="space-y-3 print:space-y-2">
                    {items.map(item => (
                        <div
                            key={item.ingredientId}
                            onClick={() => handleToggleBought(item.ingredientId)}
                            className={`flex items-center justify-between p-4 bg-white dark:bg-gray-900 border rounded-2xl shadow-sm transition-all 
                                ${item.bought ? 'border-gray-100 dark:border-gray-800/50 opacity-50 bg-gray-50 dark:bg-gray-800 print:opacity-100 print:bg-transparent' : 'border-gray-200 dark:border-gray-800 hover:border-orange-300 cursor-pointer'}
                                ${editingId === item.ingredientId ? 'ring-2 ring-orange-500 border-orange-500' : ''}`}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors 
                                    ${item.bought ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/150 print:bg-white' : 'border-gray-300'}`}>
                                    <span className={`text-white text-xs font-bold ${item.bought ? 'block print:hidden' : 'hidden'}`}>✓</span>
                                </div>

                                {editingId === item.ingredientId ? (
                                    <div className="flex flex-1 items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                                        <p className="font-bold text-gray-800 dark:text-gray-300 whitespace-nowrap hidden sm:block w-1/3 truncate">{item.name}</p>
                                        <QuantityInput
                                            value={editForm.quantity}
                                            onChange={(value) => setEditForm({ ...editForm, quantity: value })}
                                            placeholder="Qty"
                                            className="w-16 sm:w-20 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                            autoFocus
                                        />
                                        
                                        {/* Dropdown for Units */}
                                        <select
                                            value={editForm.unitId}
                                            onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })}
                                            className="w-32 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                        >
                                            <option value="">None</option>
                                            {taxonomy?.units?.map((u: any) => (
                                                <option key={u.id} value={u.id}>{u.abbreviation || u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className={`${item.bought ? 'line-through text-gray-400 dark:text-white print:no-underline' : ''}`}>
                                        <p className="font-bold text-gray-800 dark:text-gray-300 print:text-black">{item.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-200">{item.quantity} {item.unit}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 print:hidden">
                                {editingId === item.ingredientId ? (
                                    <button onClick={(e) => saveEdit(e, item)} className="p-2 text-white bg-orange-500 hover:bg-orange-600 rounded-full">
                                        <Check size={16} />
                                    </button>
                                ) : (
                                    <button onClick={(e) => startEdit(e, item)} className="p-2 text-gray-300 hover:text-orange-500">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <button onClick={(e) => editingId === item.ingredientId ? setEditingId(null) : handleRemoveItem(e, item.ingredientId)} className="p-2 text-gray-300 hover:text-red-500">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="mt-10 pt-6 print:hidden">
                        <button
                            onClick={buyAll}
                            disabled={isSyncing}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${isSyncing ? 'bg-gray-300' : 'bg-gray-900 text-white hover:bg-orange-600'}`}
                        >
                            {isSyncing ? 'Stocking Fridge...' : 'Buy All & Stock Pantry'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingList;
