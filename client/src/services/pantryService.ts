// src/services/pantryService.ts
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { storageService } from './storageService';

let isFetching = false;
let fetchPromise: Promise<any> | null = null;

export const pantryService = {
    getPantry: async (forceRefresh = false) => {
        const cachedPantry = storageService.cache.getPantry();
        
        if (cachedPantry && !forceRefresh) {
            return cachedPantry;
        }

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

    toggleHouseholdStaple: async (ingredientId: string) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/household/staples`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredientId })
            });
            return await res.json();
        } catch (error) {
            console.error("Failed to toggle household staple", error);
            throw error;
        }
    },

    clearCache: () => {
        storageService.cache.clearPantry();
    },

    optimisticUpdate: (newData: any) => {
        storageService.cache.setPantry(newData);
    }
};
