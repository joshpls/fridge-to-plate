/**
 * DB -> UI: Injects 'Fake Headers' into the flat array based on sectionName changes
 */
export const rehydrateIngredients = (dbIngredients: any[], fallbackForEdit = false) => {
    const uiList: any[] = [];
    let lastSection: string | null = null; // Start assuming no section

    (dbIngredients || []).forEach((ing) => {
        const currentSection = ing.sectionName || '';

        // If the section changed, inject a UI header row
        if (currentSection !== lastSection) {
            uiList.push({
                id: `header-${Math.random().toString(36).substring(7)}`,
                isHeader: true,
                name: currentSection, // If empty string, renders as "No Section" in logic
                ingredientId: '', amount: '', unitId: '', modifierId: ''
            });
            lastSection = currentSection;
        }

        // Push the actual ingredient (retain nested objects for RecipeDetail rendering)
        uiList.push({
            ...ing, 
            id: ing.id || Math.random().toString(36).substring(7),
            ingredientId: ing.ingredientId,
            amount: ing.amount,
            unitId: ing.unit?.id || ing.unitId || '',
            modifierId: ing.modifierId || ''
        });
    });

    // Fallback for brand new recipes in the Editor
    if (fallbackForEdit && uiList.length === 0) {
        uiList.push({ id: Math.random().toString(36).substring(7), ingredientId: '', amount: '', unitId: '', modifierId: '' });
    }

    return uiList;
};

/**
 * UI -> DB: Strips 'Fake Headers' and stamps the sectionName onto each valid ingredient
 */
export const dehydrateIngredients = (uiIngredients: any[]) => {
    const dbList: any[] = [];
    let currentSectionName: string | null = null;
    let orderTracker = 0;

    uiIngredients.forEach((item) => {
        if (item.isHeader) {
            // Update the active section when we hit a header row
            currentSectionName = item.name?.trim() || null;
        } else if (item.ingredientId && item.amount && item.unitId) {
            // Push valid ingredients with the current section name stamped on
            const { id, isHeader, name, ...rest } = item;
            dbList.push({ 
                ...rest, 
                sectionName: currentSectionName,
                order: orderTracker++ 
            });
        }
    });

    return dbList;
};