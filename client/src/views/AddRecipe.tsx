import React, { useState, useEffect, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService, type TaxonomyData } from '../services/storageService';

// Define our form state interface to keep TypeScript happy and our data predictable
interface RecipeFormData {
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
    ingredients: { ingredientId: string; amount: number | ''; unitId: string }[];
    nutrition: {
        calories: number | '';
        protein: string;
        carbohydrates: string;
        fat: { total: string };
    };
}

const initialFormState: RecipeFormData = {
    name: '', imageUrl: '', summary: '', categoryId: '', subcategoryId: '',
    prepTime: '', cookTime: '', servings: '', instructions: '', notes: '',
    tagIds: [],
    ingredients: [{ ingredientId: '', amount: '', unitId: '' }],
    nutrition: { calories: '', protein: '', carbohydrates: '', fat: { total: '' } }
};

const AddRecipe = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RecipeFormData>(initialFormState);
    const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadTaxonomy = async () => {
            const cached = storageService.cache.getTaxonomy();
            if (cached) {
                setTaxonomy(cached);
                setLoading(false);
                return;
            }
            // Fallback if cache is empty
            try {
                const res = await fetch('http://localhost:5000/api/recipes/taxonomy');
                const result = await res.json();
                if (result.status === 'success') {
                    setTaxonomy(result.data);
                    storageService.cache.setTaxonomy(result.data);
                }
            } catch (err) {
                console.error("Failed to load taxonomy", err);
            } finally {
                setLoading(false);
            }
        };
        loadTaxonomy();
    }, []);

    // --- State Handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleNutritionChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            nutrition: {
                ...prev.nutrition,
                [field]: field === 'calories' ? Number(value) : value,
                ...(field === 'fat' ? { fat: { total: value } } : {})
            }
        }));
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(tagId) 
                ? prev.tagIds.filter(id => id !== tagId) 
                : [...prev.tagIds, tagId]
        }));
    };

    // --- Ingredient Array Handlers ---
    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { 
            ...newIngredients[index], 
            [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value 
        };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const addIngredientRow = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ingredientId: '', amount: '', unitId: '' }]
        }));
    };

    const removeIngredientRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    // --- Submission ---
    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const userId = '00000000-0000-0000-0000-000000000000';
            
            // Clean up empty ingredient rows before sending
            const cleanedData = {
                ...formData,
                slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                ingredients: formData.ingredients.filter(ing => ing.ingredientId && ing.amount && ing.unitId)
            };

            const response = await fetch('http://localhost:5000/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cleanedData, userId })
            });

            if (response.ok) {
                navigate('/discovery'); // Or navigate to the newly created recipe detail page
            } else {
                alert("Failed to save recipe.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !taxonomy) return <div className="p-20 text-center text-gray-400 font-bold">Warming up the oven...</div>;

    // Filter subcategories based on selected category
    const availableSubcategories = taxonomy.subcategories.filter(sub => sub.categoryId === formData.categoryId);

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 pb-32 animate-in fade-in">
            {/* Sticky Header Bar */}
            <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-md pb-4 mb-8 border-b border-gray-100 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Draft Recipe</h1>
                    <p className="text-gray-500 font-medium">Create a new culinary masterpiece.</p>
                </div>
                <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Recipe'}
                </button>
            </div>

            <div className="space-y-10">
                {/* 1. Basic Information */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-800 border-b-2 border-gray-200 pb-2">1. Basics</h2>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Recipe Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Grandma's Lasagna" className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                        <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Summary</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="A brief description of this dish..." rows={3} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-none" />
                    </div>
                </section>

                {/* 2. Classification */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-800 border-b-2 border-gray-200 pb-2">2. Classification</h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                            <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none bg-white">
                                <option value="">Select a category</option>
                                {taxonomy.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory</label>
                            <select name="subcategoryId" value={formData.subcategoryId} onChange={handleChange} disabled={!formData.categoryId} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none bg-white disabled:bg-gray-100">
                                <option value="">Select a subcategory</option>
                                {availableSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Dietary Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {taxonomy.tags.map(tag => (
                                <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.tagIds.includes(tag.id) ? 'bg-orange-100 border-orange-400 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. Timing & Yield */}
                <section className="bg-orange-50/50 p-8 rounded-3xl border-2 border-orange-100 space-y-6">
                    <h2 className="text-xl font-black text-orange-900 border-b-2 border-orange-200/50 pb-2">3. Time & Yield</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Prep Time (min)</label>
                            <input type="number" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Cook Time (min)</label>
                            <input type="number" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Servings</label>
                            <input type="number" name="servings" value={formData.servings} onChange={handleChange} min="1" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none" />
                        </div>
                    </div>
                </section>

                {/* 4. Ingredients */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <div className="flex justify-between items-end border-b-2 border-gray-200 pb-2">
                        <h2 className="text-xl font-black text-gray-800">4. Ingredients *</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formData.ingredients.length} Items</span>
                    </div>
                    
                    <div className="space-y-3">
                        {formData.ingredients.map((ing, index) => (
                            <div key={index} className="flex gap-3 items-center bg-white p-2 rounded-2xl border-2 border-gray-100 hover:border-orange-200 transition-colors">
                                <select 
                                    required 
                                    value={ing.ingredientId} 
                                    onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                                    className="flex-1 p-3 bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
                                >
                                    <option value="" disabled>Select Ingredient...</option>
                                    {taxonomy.ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Qty" 
                                    value={ing.amount} 
                                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                                    className="w-24 p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-center"
                                />

                                <select 
                                    required 
                                    value={ing.unitId} 
                                    onChange={(e) => handleIngredientChange(index, 'unitId', e.target.value)}
                                    className="w-32 p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-gray-600 cursor-pointer"
                                >
                                    <option value="" disabled>Unit</option>
                                    {taxonomy.units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
                                </select>

                                <button type="button" onClick={() => removeIngredientRow(index)} className="p-3 text-gray-300 hover:text-red-500 transition-colors" title="Remove Ingredient">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addIngredientRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-white hover:border-orange-300 hover:text-orange-600 transition-all">
                        + Add Another Ingredient
                    </button>
                </section>

                {/* 5. Instructions & Notes */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-800 border-b-2 border-gray-200 pb-2">5. Directions</h2>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Instructions * <span className="text-gray-400 font-normal">(Separate steps with a new line)</span></label>
                        <textarea required name="instructions" value={formData.instructions} onChange={handleChange} rows={8} className="w-full p-5 rounded-2xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-y leading-relaxed" placeholder="1. Preheat the oven...&#10;2. Mix the dry ingredients..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chef's Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-5 rounded-2xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-none bg-yellow-50/30" placeholder="Any special tips, substitute suggestions, or storage advice?" />
                    </div>
                </section>

                {/* 6. Nutrition (Optional) */}
                <section className="bg-white p-8 rounded-3xl border-2 border-gray-100 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2">
                        <h2 className="text-xl font-black text-gray-800">6. Core Macros</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Optional</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Calories</label>
                            <input type="number" value={formData.nutrition.calories} onChange={(e) => handleNutritionChange('calories', e.target.value)} placeholder="e.g. 450" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Protein</label>
                            <input type="text" value={formData.nutrition.protein} onChange={(e) => handleNutritionChange('protein', e.target.value)} placeholder="e.g. 24g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Carbs</label>
                            <input type="text" value={formData.nutrition.carbohydrates} onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)} placeholder="e.g. 45g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Fat</label>
                            <input type="text" value={formData.nutrition.fat.total} onChange={(e) => handleNutritionChange('fat', e.target.value)} placeholder="e.g. 12g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                        </div>
                    </div>
                </section>
            </div>
        </form>
    );
};

export default AddRecipe;
