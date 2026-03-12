// src/services/storageService.ts

export interface ShoppingListItem {
    ingredientId: string;
    name: string;
    amount: string;
    bought: boolean;
}

const STORAGE_KEY = 'f2p_shopping_list';

export const storageService = {
    getShoppingList: (): ShoppingListItem[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveShoppingList: (list: ShoppingListItem[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        // Trigger the event for the Navigation counter
        window.dispatchEvent(new Event('shoppingListUpdated'));
    },

    addItems: (newItems: { ingredientId: string; name: string; amount: string }[]) => {
        const currentList = storageService.getShoppingList();
        
        // Merge items (avoiding duplicates if the ID and amount match)
        const updatedList = [...currentList];
        newItems.forEach(newItem => {
            const exists = updatedList.find(i => i.ingredientId === newItem.ingredientId);
            if (!exists) {
                updatedList.push({ ...newItem, bought: false });
            }
        });

        storageService.saveShoppingList(updatedList);
    },

    removeItem: (ingredientId: string) => {
        const list = storageService.getShoppingList().filter(i => i.ingredientId !== ingredientId);
        storageService.saveShoppingList(list);
    },

    clearList: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('shoppingListUpdated'));
    }
};
