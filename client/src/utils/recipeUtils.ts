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
            // amount: formatDecimalToQuantity(ing.amount),
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
    let dbList: any[] = [];
    let currentSectionName: string | null = null;
    let orderTracker = 0;

    uiIngredients.forEach((item) => {
        if (item.isHeader) {
            // Update the active section when we hit a header row
            currentSectionName = item.name?.trim() || null;
        } else if (item.ingredientId && item.amount && item.unitId) {
            // Push valid ingredients with the current section name stamped on
            const { id, isHeader, name, amount, ...rest } = item;
            dbList.push({ 
                ...rest,
                amount: parseQuantityToDecimal(item.amount),
                sectionName: currentSectionName,
                order: orderTracker++ 
            });
        }
    });

    return dbList;
};

/**
 * Validates if a string is a valid partial or complete quantity 
 * (Whole number, float, or fraction).
 */
export const isValidQuantityInput = (value: string): boolean => {
    // Allows empty string (clearing input), digits, 
    // and at most one '.' or '/' but not both.
    const regex = /^[0-9]*[./]?[0-9]*$/;
    return regex.test(value);
};

export const formatDecimalToQuantity = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val.toString();

    const whole = Math.floor(num);
    const remainder = num - whole;
    
    // Tolerance for floating point math (e.g., 0.3333333)
    const tolerance = 0.01;
    
    // Common cooking fractions
    const fractions = [
        { v: 1/8, text: '1/8' },
        { v: 1/4, text: '1/4' },
        { v: 1/3, text: '1/3' },
        { v: 3/8, text: '3/8' },
        { v: 1/2, text: '1/2' },
        { v: 5/8, text: '5/8' },
        { v: 2/3, text: '2/3' },
        { v: 3/4, text: '3/4' },
        { v: 7/8, text: '7/8' }
    ];

    let fractionText = '';
    for (const f of fractions) {
        if (Math.abs(remainder - f.v) < tolerance) {
            fractionText = f.text;
            break;
        }
    }

    if (fractionText) {
        return whole > 0 ? `${whole} ${fractionText}` : fractionText;
    }

    // If it's not a neat cooking fraction, return the decimal (max 2 decimal places)
    return parseFloat(num.toFixed(2)).toString();
};

/**
 * Converts a string (including fractions) into a decimal number for the backend.
 */
export const parseQuantityToDecimal = (value: string | number): number => {
    if (!value || value === '.' || value === '/') return 0;
    const strVal = value.toString().trim();
    
    // Handle mixed numbers like "1 1/2"
    if (strVal.includes(' ') && strVal.includes('/')) {
        const parts = strVal.split(' ');
        const whole = Number(parts[0]);
        const [num, den] = parts[1].split('/').map(Number);
        return whole + (den ? num / den : 0);
    }
    
    // Handle pure fractions like "1/3"
    if (strVal.includes('/')) {
        const [numerator, denominator] = strVal.split('/').map(Number);
        return denominator ? numerator / denominator : 0;
    }
    
    // Handle standard decimals or integers
    return parseFloat(strVal) || 0;
};


// export const parseQuantityToDecimal = (value: string | number): number => {
//     if (!value || value === '.' || value === '/') return 0;
    
//     const strVal = value.toString();
    
//     // Convert fractions like "1/3" to 0.333...
//     if (strVal.includes('/')) {
//         const [numerator, denominator] = strVal.split('/').map(Number);
//         return denominator ? numerator / denominator : 0;
//     }
    
//     // Convert normal strings to floats
//     return parseFloat(strVal) || 0;
// };