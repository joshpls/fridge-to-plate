interface IngredientSeedItem {
    name: string;
    isStaple: boolean;
}

const ingredients = [
    'Eggs',
    'Milk',
    'Butter',
    'Pasta',
    'Tomato Sauce',
    'Vegan Butter',
    'Pumpkin Puree',
    'Cream of Tartar',
    'Pumpkin Pie Spice',
    'Avocado Oil',
    'Yellow Onion',
    'Red Bell Pepper',
    'Poblano Pepper',
    'Cayenne Pepper',
    'Cilantro',
    'Diced Tomatoes',
    'Vegetable Broth',
    'Masa Harina',
    'Lime Juice',
    'Black Beans',
];
const stableIngredients = [
    'Salt',
    'Baking Soda',
    'Cinnamon',
    'Granulated Sugar',
    'Brown Sugar',
    'All-Purpose Flour',
    'Vanilla Extract',
    'Garlic',
    'Cumin',
    'Oregeno'
];

export const ingredientsToSeed = (): IngredientSeedItem[] => {
    return [
        ...stableIngredients.map(name => ({ name, isStaple: true })),
        ...ingredients.map(name => ({ name, isStaple: false }))
    ];
};
