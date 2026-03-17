// src/services/taxonomyService.ts
import { storageService, type TaxonomyData } from './storageService';

const BASE_URL = 'http://localhost:5000/api/recipes/taxonomy';

export const taxonomyService = {
    /**
     * Gets taxonomy from cache if available, otherwise fetches from API.
     * @param forceRefresh - If true, bypasses cache and fetches fresh data.
     */
    async getTaxonomy(forceRefresh = false): Promise<TaxonomyData | null> {
        if (!forceRefresh) {
            const cached = storageService.cache.getTaxonomy();
            if (cached) return cached;
        }

        try {
            const res = await fetch(BASE_URL);
            const result = await res.json();

            if (result.status === 'success') {
                const data: TaxonomyData = result.data;
                storageService.cache.setTaxonomy(data);
                return data;
            }
            return null;
        } catch (error) {
            console.error("Taxonomy Fetch Error:", error);
            return null;
        }
    },

    /**
     * Clears the cache. Call this after Admin edits (POST/PATCH/DELETE).
     */
    invalidateCache() {
        storageService.cache.clearTaxonomy();
    }
};
