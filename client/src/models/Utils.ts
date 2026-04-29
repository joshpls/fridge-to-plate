import type { TaxonomyData } from "./Recipe";

export interface FilterBarProps {
    taxonomy: any;
    
    // Text Search
    searchInput: string;
    setSearchInput: (val: string) => void;
    onExecuteSearch: () => void; // Called when user hits Enter or Search

    // Categories
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    selectedSubcategory: string;
    setSelectedSubcategory: (val: string) => void;

    // Tags
    selectedTags: string[];
    toggleTag: (tagId: string) => void;

    // Ingredients (Arrays of IDs)
    includeIngredients: string[];
    setIncludeIngredients: (val: string[]) => void;
    excludeIngredients: string[];
    setExcludeIngredients: (val: string[]) => void;

    // Toggles
    favoritesOnly: boolean;
    setFavoritesOnly: (val: boolean) => void;
    sortOrder: string;
    setSortOrder: (val: string) => void;

    onClearFilters?: () => void,
    matchOnly?: boolean,
    setMatchOnly?: (val: boolean) => void

    // Staples
    showStaples: boolean;
    setShowStaples: (val: boolean) => void;

    // Substitutions
    allowSubstitutions: boolean;
    setAllowSubstitutions: (val: boolean) => void;

    // Scope
    scope: 'all' | 'household' | 'mine';
    setScope?: (val: any) => void;

    // Rating
    minRating: string;
    setMinRating: (val: string) => void;

    // Max Cook Time
    maxTime: string;
    setMaxTime: (val: string) => void;
}

export interface NutritionProps {
    nutrition: any;
}

export interface IngredientRow {
  id: string;
  index: number;
  ingredient: { ingredientId: string; amount: number | ''; unitId: string, modifierId?: string };
  taxonomy: TaxonomyData;
  handleIngredientChange: (index: number, field: string, value: string) => void;
  removeIngredientRow: (index: number) => void;
};

export interface PantryItemUI {
    ingredientId: string;
    name: string;
    categoryId: string | null;
    isDefaultStaple: boolean;
    isHouseholdStaple: boolean;
    quantity: number | '';
    unitId: string;
    expiresAt: string; 
    addedBy?: string;
};

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export interface PromptOptions {
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
}

export interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    prompt: (options: PromptOptions) => Promise<string | null>;
}
