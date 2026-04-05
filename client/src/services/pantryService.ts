import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { storageService } from './storageService';

let isFetching = false;
let fetchPromise: Promise<any> | null = null;

export const pantryService = {
    getPantry: async (forceRefresh = false) => {
        // 1. Check centralized session storage first
        const cachedPantry = storageService.cache.getPantry();
        
        if (cachedPantry && !forceRefresh) {
            return cachedPantry;
        }

        // 2. Prevent duplicate network requests
        if (isFetching && fetchPromise) {
            return fetchPromise;
        }

        isFetching = true;
        fetchPromise = fetchWithAuth(`${API_BASE}/pantry`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch pantry");
                return res.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    // 3. Save to centralized storage
                    storageService.cache.setPantry(result.data);
                    return result.data;
                }
                return null;
            })
            .catch(err => {
                console.error("Pantry fetch error:", err);
                return null;
            })
            .finally(() => {
                isFetching = false;
                fetchPromise = null;
            });

        return fetchPromise;
    },

    clearCache: () => {
        storageService.cache.clearPantry();
    },

    // Helper to keep SessionStorage in sync with React state without an API call
    optimisticUpdate: (newList: any[]) => {
        storageService.cache.setPantry(newList);
    }
};