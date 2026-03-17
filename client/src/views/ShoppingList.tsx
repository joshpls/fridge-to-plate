// src/views/ShoppingList.tsx
import { useEffect, useState } from 'react';
import { storageService, type ShoppingListItem } from '../services/storageService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const userId = user?.id;

    // Load from Local Storage instead of API
    const loadLocalList = () => {
        setItems(storageService.shopping.get());
        setLoading(false);
    };

    useEffect(() => {
        loadLocalList();
        // Listen for updates from other components (like RecipeCard)
        window.addEventListener('shoppingListUpdated', loadLocalList);
        return () => window.removeEventListener('shoppingListUpdated', loadLocalList);
    }, []);

    const toggleItem = (ingredientId: string) => {
        storageService.shopping.removeItem(ingredientId);
        toast.success("Item removed from list");
    };

    const handleClearList = () => {
        storageService.shopping.clear();
        toast.success("List Cleared");
    };

    const buyAll = async () => {
        const list = storageService.shopping.get();
        const ingredientIds = list.map(item => item.ingredientId);

        try {
            const res = await fetch(`http://localhost:5000/api/pantry/bulk-add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ingredientIds })
            });

            if (res.ok) {
                storageService.shopping.clear();
                window.dispatchEvent(new Event('pantryUpdated'));
                toast.success("Pantry updated! 🛒");
            }
        } catch (err) {
            toast.error("Failed to update pantry");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading your list...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <header className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900">Groceries</h1>
                    <p className="text-gray-500 text-sm mt-1">Items stored locally for offline access.</p>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={handleClearList}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        Clear All
                    </button>
                )}
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400">Your list is empty!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.ingredientId}
                            onClick={() => toggleItem(item.ingredientId)}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-200 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full border-2 border-orange-200 hover:bg-orange-100" />
                                <div>
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.amount}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Remove</span>
                        </div>
                    ))}

                    <div className="mt-10 pt-6">
                        <button
                            onClick={buyAll}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                        >
                            Buy All & Stock Pantry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingList;
