// src/views/ShoppingList.tsx
import { useEffect, useState } from 'react';
import { storageService, type ShoppingListItem } from '../services/storageService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react'; // Assuming you have lucide-react installed

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Grab the token from AuthContext to secure the API call
    const { token } = useAuth();

    const loadLocalList = () => {
        setItems(storageService.shopping.get());
    };

    useEffect(() => {
        loadLocalList();
        window.addEventListener('shoppingListUpdated', loadLocalList);
        return () => window.removeEventListener('shoppingListUpdated', loadLocalList);
    }, []);

    const handleToggleBought = (ingredientId: string) => {
        storageService.shopping.toggleBought(ingredientId);
    };

    const handleRemoveItem = (e: React.MouseEvent, ingredientId: string) => {
        e.stopPropagation(); // Prevent the toggle from firing when clicking remove
        storageService.shopping.removeItem(ingredientId);
        toast.success("Item removed");
    };

    const handleClearList = () => {
        if (window.confirm("Are you sure you want to clear your list?")) {
            storageService.shopping.clear();
            toast.success("List Cleared");
        }
    };

    const buyAll = async () => {
        if (!token) {
            toast.error("You must be logged in to update your pantry.");
            return;
        }

        const list = storageService.shopping.get();
        // Optional: Only stock items that are marked as "bought"
        // const boughtItems = list.filter(item => item.bought);
        // const ingredientIds = boughtItems.map(item => item.ingredientId);
        
        const ingredientIds = list.map(item => item.ingredientId);

        setIsSyncing(true);
        try {
            const res = await fetch(`http://localhost:5000/api/pantry/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Added the missing auth header!
                },
                body: JSON.stringify({ ingredientIds })
            });

            const result = await res.json();

            if (result.status === 'success') {
                toast.success("Pantry successfully stocked!");
                storageService.shopping.clear(); // Empty the cart on success
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
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24">
            <header className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping List</h1>
                {items.length > 0 && (
                    <button 
                        onClick={handleClearList}
                        className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <span className="text-4xl mb-3 block">🛒</span>
                    <p className="text-gray-400 font-medium">Your cart is empty.</p>
                    <p className="text-sm text-gray-400 mt-2">Find a recipe and tap "Add Missing" to start shopping!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div 
                            key={item.ingredientId}
                            onClick={() => handleToggleBought(item.ingredientId)}
                            className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all ${
                                item.bought ? 'border-gray-100 opacity-50 bg-gray-50' : 'border-gray-200 hover:border-orange-300'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Visual Checkbox */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    item.bought ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                }`}>
                                    {item.bought && <span className="text-white text-xs font-bold">✓</span>}
                                </div>
                                
                                <div className={item.bought ? 'line-through text-gray-400' : ''}>
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.amount}</p>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button 
                                onClick={(e) => handleRemoveItem(e, item.ingredientId)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}

                    <div className="mt-10 pt-6">
                        <button
                            onClick={buyAll}
                            disabled={isSyncing}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
                                isSyncing 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-900 text-white hover:bg-orange-600'
                            }`}
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
