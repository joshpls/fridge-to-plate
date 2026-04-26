import type { ShoppingListItem, TaxonomyData } from "../models/Recipe";

// Keys for our storage domains
const KEYS = {
    SHOPPING: 'f2p_shopping_list',
    TAXONOMY: 'f2p_taxonomy_cache',
    PANTRY: 'f2p_pantry_cache',
    FILTERBAR: 'f2p_discovery_filters',
    DISCOVERY_STATE: 'f2p_discovery_state',
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

        addItems: (newItems: { ingredientId: string; name: string; quantity: string, unit: string, unitId: string | null }[]) => {
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

        toggleBought: (ingredientId: string) => {
            const list = storageService.shopping.get();
            const updatedList = list.map(item =>
                item.ingredientId === ingredientId
                    ? { ...item, bought: !item.bought }
                    : item
            );
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

        // Taxonomy
        getTaxonomy: () => storageService.cache.get<TaxonomyData>(KEYS.TAXONOMY),
        setTaxonomy: (data: TaxonomyData) => storageService.cache.set(KEYS.TAXONOMY, data),
        clearTaxonomy: () => sessionStorage.removeItem(KEYS.TAXONOMY),

        // Pantry
        getPantry: () => storageService.cache.get<any[]>(KEYS.PANTRY),
        setPantry: (data: any[]) => {storageService.cache.set(KEYS.PANTRY, data); storageService.cache.clearDiscoveryState(), storageService.cache.clearAllRecipes()},
        clearPantry: () => {sessionStorage.removeItem(KEYS.PANTRY); storageService.cache.clearDiscoveryState(), storageService.cache.clearAllRecipes()},

        // Recipe
        getRecipe: (slug: string, userId?: string | null) =>
            storageService.cache.get<any>(`f2p_recipe_${slug}_${userId || 'guest'}`),
        setRecipe: (slug: string, data: any, userId?: string | null) =>
            storageService.cache.set(`f2p_recipe_${slug}_${userId || 'guest'}`, data),
        clearRecipe: (slug: string, userId?: string | null) => {sessionStorage.removeItem(`f2p_recipe_${slug}_${userId || 'guest'}`)},
        clearAllRecipes: () => {
            Object.keys(sessionStorage)
                .filter(key => key.startsWith('f2p_recipe_'))
                .forEach(key => sessionStorage.removeItem(key));
        },

        // Discovery Scroll & Pagination Restoration
        getDiscoveryState: () => storageService.cache.get<{ recipes: any[]; page: number; hasMore: boolean; scrollY: number }>(KEYS.DISCOVERY_STATE),
        setDiscoveryState: (state: { recipes: any[]; page: number; hasMore: boolean; scrollY: number }) => storageService.cache.set(KEYS.DISCOVERY_STATE, state),
        clearDiscoveryState: () => sessionStorage.removeItem(KEYS.DISCOVERY_STATE),

        clearAll: () => sessionStorage.clear()
    }
};
