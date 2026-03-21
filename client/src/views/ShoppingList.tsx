// src/views/ShoppingList.tsx
import { useEffect, useState } from 'react';
import { storageService, type ShoppingListItem } from '../services/storageService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { X, Printer } from 'lucide-react'; // Added Printer icon
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
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
        e.stopPropagation(); 
        storageService.shopping.removeItem(ingredientId);
        toast.success("Item removed");
    };

    const handleClearList = () => {
        if (window.confirm("Are you sure you want to clear your list?")) {
            storageService.shopping.clear();
            toast.success("List Cleared");
        }
    };

    // --- NEW: Print Function ---
    const handlePrint = () => {
        window.print();
    };

    const buyAll = async () => {
        if (!token) {
            toast.error("You must be logged in to update your pantry.");
            return;
        }

        const list = storageService.shopping.get();
        const ingredientIds = list.map(item => item.ingredientId);

        setIsSyncing(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/pantry/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredientIds })
            });

            const result = await res.json();

            if (result.status === 'success') {
                toast.success("Pantry successfully stocked!");
                storageService.shopping.clear(); 
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
        // Added print:p-0 to remove padding on printed page
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24 print:p-0 print:m-0 print:space-y-4">
            
            <header className="flex items-center justify-between border-b border-gray-100 pb-4 print:border-b-2 print:border-black">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight print:text-4xl">Shopping List</h1>
                    {/* Only show the date on the printed version */}
                    <p className="hidden print:block text-gray-500 font-bold mt-1">
                        {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Hide these controls when printing */}
                <div className="flex gap-4 items-center print:hidden">
                    {items.length > 0 && (
                        <>
                            <button 
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                <Printer size={16} /> Print
                            </button>
                            <button 
                                onClick={handleClearList}
                                className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                        </>
                    )}
                </div>
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 print:hidden">
                    <span className="text-4xl mb-3 block">🛒</span>
                    <p className="text-gray-400 font-medium">Your cart is empty.</p>
                    <p className="text-sm text-gray-400 mt-2">Find a recipe and tap "Add Missing" to start shopping!</p>
                </div>
            ) : (
                <div className="space-y-3 print:space-y-2">
                    {items.map(item => (
                        <div 
                            key={item.ingredientId}
                            onClick={() => handleToggleBought(item.ingredientId)}
                            // Print styles: Remove background/shadows, add simple bottom border
                            className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all print:border-0 print:border-b print:border-gray-300 print:rounded-none print:shadow-none print:p-2 ${
                                item.bought ? 'border-gray-100 opacity-50 bg-gray-50 print:opacity-100 print:bg-transparent' : 'border-gray-200 hover:border-orange-300'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Visual Checkbox (For web and print) */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors print:w-5 print:h-5 print:rounded-sm print:border-black ${
                                    item.bought ? 'border-orange-500 bg-orange-500 print:bg-white' : 'border-gray-300'
                                }`}>
                                    {/* Show checkmark if bought online, or leave empty box for printing */}
                                    <span className={`text-white text-xs font-bold ${item.bought ? 'block print:hidden' : 'hidden'}`}>✓</span>
                                </div>
                                
                                {/* Item Name & Amount */}
                                <div className={`${item.bought ? 'line-through text-gray-400 print:no-underline print:text-black' : 'print:text-black'}`}>
                                    <p className="font-bold text-gray-800 print:text-black print:text-lg">{item.name}</p>
                                    <p className="text-xs text-gray-500 print:text-gray-600 print:text-sm">{item.amount}</p>
                                </div>
                            </div>

                            {/* Hide Delete Button when printing */}
                            <button 
                                onClick={(e) => handleRemoveItem(e, item.ingredientId)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors print:hidden"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}

                    {/* Hide "Buy All" when printing */}
                    <div className="mt-10 pt-6 print:hidden">
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
