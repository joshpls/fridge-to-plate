export interface Subcategory {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
    subcategories: Subcategory[];
}

export interface ShoppingListItem {
    ingredientId: string;
    name: string;
    amount: string;
    bought: boolean;
}

export interface TaxonomyData {
    categories: Category[];
    tags: any[];
    units: any[];
    ingredients: any[];
    modifiers: any[];
}

export interface Ingredient {
    id: string;
    name: string;
    isStaple: boolean;
}

export interface Nutrition {
    calories: number | '';
    protein: string;
    carbohydrates: string;
    fat: {
        total: string;
        saturatedFat?: string;
        polyunsaturatedFat?: string;
        monounsaturatedFat?: string;
        transFat?: string;
    };
    fiber?: string;
    sugar?: string;
    sodium?: string;
    potassium?: string;
    vitaminA?: string;
    vitaminC?: string;
    calcium?: string;
    iron?: string;
    [key: string]: any;
};

export interface RecipeFormData {
    id?: string;
    name: string;
    imageUrl: string;
    summary: string;
    categoryId: string;
    subcategoryId: string;
    prepTime: number | '';
    cookTime: number | '';
    servings: number | '';
    instructions: string;
    notes: string;
    tagIds: string[];
    ingredients: { id: string; ingredientId: string; amount: number | ''; unitId: string, modifierId?: string;}[];
    nutrition: Nutrition;
}

export const initialRecipe: RecipeFormData = {
    name: '', imageUrl: '', summary: '', categoryId: '', subcategoryId: '',
    prepTime: '', cookTime: '', servings: '', instructions: '', notes: '',
    tagIds: [],
    // Initial id is generated
    ingredients: [{ id: Math.random().toString(36).substring(7), ingredientId: '', amount: '', unitId: '', modifierId: '' }],
    nutrition: { 
        calories: '', protein: '', carbohydrates: '', 
        fat: { total: '', saturatedFat: '', polyunsaturatedFat: '', monounsaturatedFat: '', transFat: '' },
        fiber: '', sugar: '', sodium: '', potassium: '', vitaminA: '', vitaminC: '', calcium: '', iron: ''
    }
};
