
const getUnitSystem = (unit: string): 'metric' | 'imperial' | 'neutral' => {
    const u = unit.toLowerCase().trim();

    console.log("u:", u);
    
    const metric = ['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters'];
    const imperial = ['tsp', 'teaspoon', 'teaspoons', 'tbsp', 'tablespoon', 'tablespoons', 'cup', 'cups', 'fl oz', 'fluid ounce', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'pt', 'pint', 'qt', 'quart', 'gal', 'gallon'];

    if (metric.includes(u)) return 'metric';
    if (imperial.includes(u)) return 'imperial';
    return 'neutral';
};

/**
 * Converts common cooking units between Imperial and Metric.
 * @param amount The numerical amount
 * @param unit The unit abbreviation (e.g., 'cup', 'ml', 'oz', 'g')
 * @param targetSystem 'imperial' or 'metric'
 * @returns An object containing the converted { amount, unit }
 */
export const convertUnit = (amount: number, unit: string, targetSystem: 'imperial' | 'metric'): { amount: number, unit: string } => {
    if (!amount || !unit) return { amount, unit };

    const currentSystem = getUnitSystem(unit);
    console.log("Current System: ", currentSystem);

    if (currentSystem === targetSystem || currentSystem === 'neutral') {
        return { amount, unit };
    }

    const lowerUnit = unit.toLowerCase().trim();

    // Logic for Metric conversion (From Imperial)
    if (targetSystem === 'metric') {
        switch (lowerUnit) {
            case 'tsp': case 'teaspoon': return { amount: amount * 4.93, unit: 'ml' };
            case 'tbsp': case 'tablespoon': return { amount: amount * 14.79, unit: 'ml' };
            case 'fl oz': case 'fluid ounce': return { amount: amount * 29.57, unit: 'ml' };
            case 'cup': case 'cups': return { amount: amount * 236.59, unit: 'ml' };
            case 'pt': case 'pint': return { amount: amount * 473.18, unit: 'ml' };
            case 'qt': case 'quart': return { amount: amount * 946.35, unit: 'ml' };
            case 'gal': case 'gallon': return { amount: amount * 3.79, unit: 'L' };
            // Mass/Weight Conversions
            case 'oz': case 'ounce': return { amount: amount * 28.35, unit: 'g' };
            case 'lb': case 'lbs': case 'pound': return { amount: amount * 453.59, unit: 'g' };
        }
    } 
    
    // Logic for Imperial conversion (From Metric)
    else if (targetSystem === 'imperial') {
        switch (lowerUnit) {
            case 'ml': case 'milliliter': 
                if (amount >= 236) return { amount: amount / 236.59, unit: 'cup' };
                if (amount >= 15) return { amount: amount / 14.79, unit: 'tbsp' };
                return { amount: amount / 4.93, unit: 'tsp' };
            case 'l': case 'liter': return { amount: amount * 4.22, unit: 'cups' };
            case 'g': case 'gram': 
                if (amount >= 453) return { amount: amount / 453.59, unit: 'lb' };
                return { amount: amount / 28.35, unit: 'oz' };
            case 'kg': case 'kilogram': return { amount: amount * 2.20, unit: 'lb' };
        }
    }

    return { amount, unit };
};
