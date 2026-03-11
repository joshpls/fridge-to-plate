import { useEffect, useState } from 'react';
import { refreshPantryCount } from '../utils/events';

const ShoppingList = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = '00000000-0000-0000-0000-000000000000';

    const fetchList = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/shopping-list/${userId}`);
            const result = await res.json();
            if (result.status === 'success') setItems(result.data);
        } catch (err) {
            console.error("Error fetching shopping list:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const toggleItem = async (itemId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`http://localhost:5000/api/shopping-list/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bought: !currentStatus })
            });

            if (res.ok) {
                setItems(prev => prev.filter(item => item.id !== itemId));
                refreshPantryCount();
            }
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleClearList = async () => {
        if (!window.confirm("Empty your entire shopping list?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/shopping-list/${userId}`, {
                method: 'DELETE'
            });
            if (res.ok) setItems([]);
        } catch (err) {
            console.error("Clear failed:", err);
        }
    };

    const buyAll = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/shopping-list/buy-all/${userId}`, {
                method: 'POST'
            });
            if (res.ok) {
                setItems([]);
                refreshPantryCount();
            }
        } catch (err) {
            console.error("Buy all failed", err);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading list...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <header className="flex justify-between items-center mb-8">
                <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900">Groceries</h1>
                        <p className="text-gray-500 text-sm mt-1">Mark items as bought to move them to your pantry.</p>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={handleClearList}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg uppercase hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400">Your pantry is full! No items needed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id, item.bought)}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-200 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full border-2 border-orange-200" />
                                <div>
                                    <p className="font-bold text-gray-800">{item.ingredient.name}</p>
                                    <p className="text-xs text-gray-500">{item.amount}</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Tap to Buy</span>
                        </div>
                    ))}
                    {items.length > 0 && (
                        <div className="mt-10 pt-6 border-t border-gray-100">
                            <button
                                onClick={buyAll}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                            >
                                Buy All & Stock Pantry
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShoppingList;