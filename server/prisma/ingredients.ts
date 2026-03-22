interface IngredientSeedItem {
    name: string;
    isStaple: boolean;
}

const ingredients = [
    // --- Proteins ---
    'Chicken Breast',
    'Ground Beef',
    'Salmon Fillets',
    'Tofu',
    'Tempeh',
    'Bacon',
    'Shrimp',
    'Pork Chops',
    
    // --- Dairy & Alternatives ---
    'Eggs',
    'Milk',
    'Butter',
    'Vegan Butter',
    'Heavy Cream',
    'Sour Cream',
    'Greek Yogurt',
    'Parmesan Cheese',
    'Cheddar Cheese',
    'Mozzarella Cheese',
    
    // --- Produce ---
    'Yellow Onion',
    'Red Onion',
    'Red Bell Pepper',
    'Green Bell Pepper',
    'Poblano Pepper',
    'Jalapeño',
    'Spinach',
    'Kale',
    'Broccoli',
    'Cauliflower',
    'Carrots',
    'Celery',
    'Zucchini',
    'Mushrooms',
    'Sweet Potato',
    'Russet Potato',
    'Lemon',
    'Lime',
    'Avocado',
    'Cilantro',
    'Parsley',
    'Green Onions',
    
    // --- Canned & Packaged ---
    'Tomato Sauce',
    'Diced Tomatoes',
    'Tomato Paste',
    'Pumpkin Puree',
    'Black Beans',
    'Chickpeas',
    'Kidney Beans',
    'Vegetable Broth',
    'Chicken Broth',
    'Beef Broth',
    'Coconut Milk',
    'Pasta',
    'Tortillas',
    'Breadcrumbs',
];

const stapleIngredients = [
    // --- Baking & Dry Goods ---
    'Salt',
    'Black Pepper',
    'Baking Soda',
    'Baking Powder',
    'Cream of Tartar',
    'All-Purpose Flour',
    'Bread Flour',
    'Masa Harina',
    'Cornstarch',
    'Granulated Sugar',
    'Brown Sugar',
    'Powdered Sugar',
    'Honey',
    'Maple Syrup',
    'Vanilla Extract',
    'Cocoa Powder',
    'Yeast',
    
    // --- Oils & Vinegars ---
    'Avocado Oil',
    'Olive Oil',
    'Extra Virgin Olive Oil',
    'Vegetable Oil',
    'Sesame Oil',
    'Coconut Oil',
    'Apple Cider Vinegar',
    'White Vinegar',
    'Balsamic Vinegar',
    'Rice Vinegar',
    
    // --- Spices & Herbs (Dried) ---
    'Garlic',
    'Cumin',
    'Oregano',
    'Cinnamon',
    'Pumpkin Pie Spice',
    'Cayenne Pepper',
    'Smoked Paprika',
    'Chili Powder',
    'Turmeric',
    'Dried Basil',
    'Dried Thyme',
    'Dried Rosemary',
    'Bay Leaves',
    'Ground Ginger',
    'Nutmeg',
    'Red Pepper Flakes',
    'Onion Powder',
    'Garlic Powder',
    
    // --- Condiments & Grains ---
    'Soy Sauce',
    'Dijon Mustard',
    'Worcestershire Sauce',
    'Ketchup',
    'Mayonnaise',
    'White Rice',
    'Brown Rice',
    'Quinoa',
    'Lentils',
    'Rolled Oats'
];

export const ingredientsToSeed = (): IngredientSeedItem[] => {
    return [
        ...stapleIngredients.map(name => ({ name, isStaple: true })),
        ...ingredients.map(name => ({ name, isStaple: false }))
    ];
};
