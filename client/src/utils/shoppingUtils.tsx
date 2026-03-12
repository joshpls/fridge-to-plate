// src/utils/shoppingUtils.tsx
import { toast } from 'react-hot-toast';
import { storageService } from '../services/storageService';

export const addIngredientsToShoppingList = async (
    items: { ingredientId: string; amount: string; name: string }[]
) => {
    if (items.length === 0) return { success: false, count: 0 };

    try {
        // Add to Local Storage instead of DB
        storageService.addItems(items);

        toast.success((t) => (
            <div className="flex items-center gap-3 text-sm font-medium">
                <span>Added {items.length} items</span>
                <button
                    onClick={() => {
                        // Undo: Remove the items we just added
                        items.forEach(item => storageService.removeItem(item.ingredientId));
                        toast.dismiss(t.id);
                        toast.error("Add undone", { duration: 2000 });
                    }}
                    className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[10px] font-bold uppercase"
                >
                    Undo
                </button>
            </div>
        ), {
            duration: 4000,
            style: { borderRadius: '8px', background: '#1f2937', color: '#fff', padding: '8px 12px' },
        });

        return { success: true, count: items.length };
    } catch (err) {
        toast.error('Could not update list.');
        return { success: false, count: 0 };
    }
};
