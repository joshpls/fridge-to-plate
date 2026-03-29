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
    sortOrder: 'asc' | 'desc';
    setSortOrder: (val: 'asc' | 'desc') => void;

    // Staples
    showStaples: boolean;
    setShowStaples: (val: boolean) => void;
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
