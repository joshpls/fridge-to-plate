export interface IngredientSeedItem {
    name: string;
    isStaple: boolean;
    category: string;
}

const ingredients: Omit<IngredientSeedItem, 'isStaple'>[] = [
    // --- Proteins ---
    { name: 'Chicken Breast', category: 'Proteins' },
    { name: 'Ground Beef', category: 'Proteins' },
    { name: 'Salmon Fillets', category: 'Proteins' },
    { name: 'Tofu', category: 'Proteins' },
    { name: 'Tempeh', category: 'Proteins' },
    { name: 'Bacon', category: 'Proteins' },
    { name: 'Shrimp', category: 'Proteins' },
    { name: 'Pork Chops', category: 'Proteins' },
    
    // --- Dairy & Alternatives ---
    { name: 'Eggs', category: 'Dairy & Alternatives' },
    { name: 'Milk', category: 'Dairy & Alternatives' },
    { name: 'Butter', category: 'Dairy & Alternatives' },
    { name: 'Vegan Butter', category: 'Dairy & Alternatives' },
    { name: 'Heavy Cream', category: 'Dairy & Alternatives' },
    { name: 'Sour Cream', category: 'Dairy & Alternatives' },
    { name: 'Greek Yogurt', category: 'Dairy & Alternatives' },
    { name: 'Parmesan Cheese', category: 'Dairy & Alternatives' },
    { name: 'Cheddar Cheese', category: 'Dairy & Alternatives' },
    { name: 'Mozzarella Cheese', category: 'Dairy & Alternatives' },
    
    // --- Produce ---
    { name: 'Yellow Onion', category: 'Produce' },
    { name: 'Red Onion', category: 'Produce' },
    { name: 'Red Bell Pepper', category: 'Produce' },
    { name: 'Green Bell Pepper', category: 'Produce' },
    { name: 'Poblano Pepper', category: 'Produce' },
    { name: 'Jalapeño', category: 'Produce' },
    { name: 'Spinach', category: 'Produce' },
    { name: 'Kale', category: 'Produce' },
    { name: 'Broccoli', category: 'Produce' },
    { name: 'Cauliflower', category: 'Produce' },
    { name: 'Carrots', category: 'Produce' },
    { name: 'Celery', category: 'Produce' },
    { name: 'Zucchini', category: 'Produce' },
    { name: 'Mushrooms', category: 'Produce' },
    { name: 'Sweet Potato', category: 'Produce' },
    { name: 'Russet Potato', category: 'Produce' },
    { name: 'Lemon', category: 'Produce' },
    { name: 'Lime', category: 'Produce' },
    { name: 'Avocado', category: 'Produce' },
    { name: 'Cilantro', category: 'Produce' },
    { name: 'Parsley', category: 'Produce' },
    { name: 'Green Onions', category: 'Produce' },
    
    // --- Canned & Packaged ---
    { name: 'Tomato Sauce', category: 'Canned & Packaged' },
    { name: 'Diced Tomatoes', category: 'Canned & Packaged' },
    { name: 'Tomato Paste', category: 'Canned & Packaged' },
    { name: 'Pumpkin Puree', category: 'Canned & Packaged' },
    { name: 'Black Beans', category: 'Canned & Packaged' },
    { name: 'Chickpeas', category: 'Canned & Packaged' },
    { name: 'Kidney Beans', category: 'Canned & Packaged' },
    { name: 'Vegetable Broth', category: 'Canned & Packaged' },
    { name: 'Chicken Broth', category: 'Canned & Packaged' },
    { name: 'Beef Broth', category: 'Canned & Packaged' },
    { name: 'Coconut Milk', category: 'Canned & Packaged' },
    { name: 'Pasta', category: 'Canned & Packaged' },
    { name: 'Tortillas', category: 'Canned & Packaged' },
    { name: 'Breadcrumbs', category: 'Canned & Packaged' },
];

const stapleIngredients: Omit<IngredientSeedItem, 'isStaple'>[] = [
    // --- Baking & Dry Goods ---
    { name: 'Salt', category: 'Baking & Dry Goods' },
    { name: 'Black Pepper', category: 'Baking & Dry Goods' },
    { name: 'Baking Soda', category: 'Baking & Dry Goods' },
    { name: 'Baking Powder', category: 'Baking & Dry Goods' },
    { name: 'Cream of Tartar', category: 'Baking & Dry Goods' },
    { name: 'All-Purpose Flour', category: 'Baking & Dry Goods' },
    { name: 'Bread Flour', category: 'Baking & Dry Goods' },
    { name: 'Masa Harina', category: 'Baking & Dry Goods' },
    { name: 'Cornstarch', category: 'Baking & Dry Goods' },
    { name: 'Granulated Sugar', category: 'Baking & Dry Goods' },
    { name: 'Brown Sugar', category: 'Baking & Dry Goods' },
    { name: 'Powdered Sugar', category: 'Baking & Dry Goods' },
    { name: 'Honey', category: 'Baking & Dry Goods' },
    { name: 'Maple Syrup', category: 'Baking & Dry Goods' },
    { name: 'Vanilla Extract', category: 'Baking & Dry Goods' },
    { name: 'Cocoa Powder', category: 'Baking & Dry Goods' },
    { name: 'Yeast', category: 'Baking & Dry Goods' },
    
    // --- Oils & Vinegars ---
    { name: 'Avocado Oil', category: 'Oils & Vinegars' },
    { name: 'Olive Oil', category: 'Oils & Vinegars' },
    { name: 'Extra Virgin Olive Oil', category: 'Oils & Vinegars' },
    { name: 'Vegetable Oil', category: 'Oils & Vinegars' },
    { name: 'Sesame Oil', category: 'Oils & Vinegars' },
    { name: 'Coconut Oil', category: 'Oils & Vinegars' },
    { name: 'Apple Cider Vinegar', category: 'Oils & Vinegars' },
    { name: 'White Vinegar', category: 'Oils & Vinegars' },
    { name: 'Balsamic Vinegar', category: 'Oils & Vinegars' },
    { name: 'Rice Vinegar', category: 'Oils & Vinegars' },
    
    // --- Spices & Herbs ---
    { name: 'Garlic', category: 'Spices & Herbs' },
    { name: 'Cumin', category: 'Spices & Herbs' },
    { name: 'Oregano', category: 'Spices & Herbs' },
    { name: 'Cinnamon', category: 'Spices & Herbs' },
    { name: 'Pumpkin Pie Spice', category: 'Spices & Herbs' },
    { name: 'Cayenne Pepper', category: 'Spices & Herbs' },
    { name: 'Smoked Paprika', category: 'Spices & Herbs' },
    { name: 'Chili Powder', category: 'Spices & Herbs' },
    { name: 'Turmeric', category: 'Spices & Herbs' },
    { name: 'Dried Basil', category: 'Spices & Herbs' },
    { name: 'Dried Thyme', category: 'Spices & Herbs' },
    { name: 'Dried Rosemary', category: 'Spices & Herbs' },
    { name: 'Bay Leaves', category: 'Spices & Herbs' },
    { name: 'Ground Ginger', category: 'Spices & Herbs' },
    { name: 'Nutmeg', category: 'Spices & Herbs' },
    { name: 'Red Pepper Flakes', category: 'Spices & Herbs' },
    { name: 'Onion Powder', category: 'Spices & Herbs' },
    { name: 'Garlic Powder', category: 'Spices & Herbs' },
    
    // --- Condiments & Grains ---
    { name: 'Soy Sauce', category: 'Condiments & Sauces' },
    { name: 'Dijon Mustard', category: 'Condiments & Sauces' },
    { name: 'Worcestershire Sauce', category: 'Condiments & Sauces' },
    { name: 'Ketchup', category: 'Condiments & Sauces' },
    { name: 'Mayonnaise', category: 'Condiments & Sauces' },
    { name: 'White Rice', category: 'Grains & Legumes' },
    { name: 'Brown Rice', category: 'Grains & Legumes' },
    { name: 'Quinoa', category: 'Grains & Legumes' },
    { name: 'Lentils', category: 'Grains & Legumes' },
    { name: 'Rolled Oats', category: 'Grains & Legumes' }
];

export const ingredientsToSeed = (): IngredientSeedItem[] => {
    return [
        ...stapleIngredients.map(item => ({ ...item, isStaple: true })),
        ...ingredients.map(item => ({ ...item, isStaple: false }))
    ];
};
