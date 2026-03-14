export interface ShoppingListItem {
    ingredientId: string;
    name: string;
    amount: string;
    bought: boolean;
}

export interface DiscoveryMetadata {
    cats: any[];
    tags: any[];
}

// Keys for our storage domains
const KEYS = {
    SHOPPING: 'f2p_shopping_list',
    DISCOVERY_META: 'f2p_discovery_metadata',
};

export const storageService = {
    /**
     * PERSISTENT STORAGE (LocalStorage)
     */
    shopping: {
        get: (): ShoppingListItem[] => {
            const data = localStorage.getItem(KEYS.SHOPPING);
            return data ? JSON.parse(data) : [];
        },

        save: (list: ShoppingListItem[]) => {
            localStorage.setItem(KEYS.SHOPPING, JSON.stringify(list));
            window.dispatchEvent(new Event('shoppingListUpdated'));
        },

        addItems: (newItems: { ingredientId: string; name: string; amount: string }[]) => {
            const currentList = storageService.shopping.get();
            const updatedList = [...currentList];
            
            newItems.forEach(newItem => {
                const exists = updatedList.find(i => i.ingredientId === newItem.ingredientId);
                if (!exists) {
                    updatedList.push({ ...newItem, bought: false });
                }
            });

            storageService.shopping.save(updatedList);
        },

        removeItem: (ingredientId: string) => {
            const list = storageService.shopping.get().filter(i => i.ingredientId !== ingredientId);
            storageService.shopping.save(list);
        },

        clear: () => {
            localStorage.removeItem(KEYS.SHOPPING);
            window.dispatchEvent(new Event('shoppingListUpdated'));
        }
    },

    /**
     * TRANSIENT CACHE (SessionStorage)
     * For API responses that stay the same during a single visit.
     */
    cache: {
        get: <T>(key: string): T | null => {
            const data = sessionStorage.getItem(key);
            try {
                return data ? JSON.parse(data) as T : null;
            } catch (e) {
                console.error(`Error parsing session key: ${key}`, e);
                return null;
            }
        },

        set: (key: string, value: any) => {
            sessionStorage.setItem(key, JSON.stringify(value));
        },

        getDiscoveryMeta: () => storageService.cache.get<DiscoveryMetadata>(KEYS.DISCOVERY_META),
        setDiscoveryMeta: (data: DiscoveryMetadata) => storageService.cache.set(KEYS.DISCOVERY_META, data),

        clearAll: () => sessionStorage.clear()
    }
};
