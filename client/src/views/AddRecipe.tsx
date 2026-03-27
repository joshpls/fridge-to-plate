import React, { useState, useEffect, type SubmitEvent, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taxonomyService } from '../services/taxonomyService';
import { API_BASE, getNetworkImageUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { SortableIngredientRow } from '../components/recipes/SortableIngredientRow';
import { initialRecipe, type RecipeFormData, type TaxonomyData } from '../models/Recipe';
import { AddNutrition } from '../components/recipes/AddNutrition';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const AddRecipe = () => {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>(); 
    const { user } = useAuth();
    const userId = user?.id;
    
    const [formData, setFormData] = useState<RecipeFormData>(initialRecipe);
    const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const originalImageUrlRef = useRef<string>('');
    const currentImageUrlRef = useRef<string>('');
    const isSubmittedRef = useRef<boolean>(false);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const initializeForm = async () => {
            try {
                const taxonomy = await taxonomyService.getTaxonomy(true);
                if (taxonomy) {
                    setTaxonomy(taxonomy);
                }

                if (slug) {
                    const res = await fetchWithAuth(`${API_BASE}/recipes/${slug}?userId=${userId}`);
                    const result = await res.json();

                    if (result.status === 'success') {
                        const r = result.data;
                        const fetchedNutrition = r.nutrition || {};
                        const fetchedFat = fetchedNutrition.fat || {};
                        originalImageUrlRef.current = r.imageUrl || '';
                        currentImageUrlRef.current = r.imageUrl || '';

                        setFormData({
                            id: r.id,
                            name: r.name || '',
                            imageUrl: r.imageUrl || '',
                            summary: r.summary || '',
                            categoryId: r.category?.id || '',
                            subcategoryId: r.subcategory?.id || '',
                            prepTime: r.prepTime || '',
                            cookTime: r.cookTime || '',
                            servings: r.servings || '',
                            instructions: r.instructions || '',
                            notes: r.notes || '',
                            tagIds: r.tags?.map((t: any) => t.id) || [],
                            ingredients: r.ingredients?.map((i: any) => ({
                                id: i.id || Math.random().toString(36).substring(7), // Ensure existing ingredients get IDs
                                ingredientId: i.ingredientId,
                                amount: i.amount,
                                unitId: i.unit?.id || ''
                            })) || [{ id: Math.random().toString(36).substring(7), ingredientId: '', amount: '', unitId: '' }],
                            nutrition: {
                                calories: fetchedNutrition.calories || '',
                                protein: fetchedNutrition.protein || '',
                                carbohydrates: fetchedNutrition.carbohydrates || '',
                                fat: { 
                                    total: fetchedFat.total || '',
                                    saturatedFat: fetchedFat.saturatedFat || '',
                                    polyunsaturatedFat: fetchedFat.polyunsaturatedFat || '',
                                    monounsaturatedFat: fetchedFat.monounsaturatedFat || '',
                                    transFat: fetchedFat.transFat || ''
                                },
                                fiber: fetchedNutrition.fiber || '',
                                sugar: fetchedNutrition.sugar || '',
                                sodium: fetchedNutrition.sodium || '',
                                potassium: fetchedNutrition.potassium || '',
                                vitaminA: fetchedNutrition.vitaminA || '',
                                vitaminC: fetchedNutrition.vitaminC || '',
                                calcium: fetchedNutrition.calcium || '',
                                iron: fetchedNutrition.iron || '',
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setLoading(false);
            }
        };

        initializeForm();
    }, [slug, userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleNutritionChange = (field: string, value: string, isFatSubfield: boolean = false) => {
        setFormData(prev => {
            if (isFatSubfield) {
                return {
                    ...prev,
                    nutrition: {
                        ...prev.nutrition,
                        fat: {
                            ...(prev.nutrition.fat || {}),
                            [field]: value
                        }
                    }
                };
            }
            return {
                ...prev,
                nutrition: {
                    ...prev.nutrition,
                    [field]: field === 'calories' ? (value === '' ? '' : Number(value)) : value,
                }
            };
        });
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(tagId)
                ? prev.tagIds.filter(id => id !== tagId)
                : [...prev.tagIds, tagId]
        }));
    };

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = {
            ...newIngredients[index],
            [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value
        };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const addIngredientRow = () => setFormData(prev => ({ 
        ...prev, 
        ingredients: [...prev.ingredients, { id: Math.random().toString(36).substring(7), ingredientId: '', amount: '', unitId: '' }] 
    }));
    
    const removeIngredientRow = (index: number) => setFormData(prev => ({ 
        ...prev, 
        ingredients: prev.ingredients.filter((_, i) => i !== index) 
    }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFormData((prev) => {
                const oldIndex = prev.ingredients.findIndex((item) => item.id === active.id);
                const newIndex = prev.ingredients.findIndex((item) => item.id === over.id);

                return {
                    ...prev,
                    // arrayMove is a dnd-kit utility to swap positions
                    ingredients: arrayMove(prev.ingredients, oldIndex, newIndex),
                };
            });
        }
    };

    const uploadFileToServer = async (file: File) => {
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await fetchWithAuth(`${API_BASE}/upload`, {
                method: 'POST',
                body: uploadData
            });
            const result = await res.json();
            if (result.status === 'success') {
                if (currentImageUrlRef.current && currentImageUrlRef.current !== originalImageUrlRef.current) {
                    fetchWithAuth(`${API_BASE}/upload`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: currentImageUrlRef.current })
                    }).catch(console.error);
                }
                currentImageUrlRef.current = result.imageUrl;
                setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
            } else {
                toast.error("Upload failed: " + result.message);
            }
        } catch (err) {
            console.error("Failed to upload", err);
            toast.error("Network Error during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFileToServer(file);
    };

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        uploadFileToServer(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    useEffect(() => {
        return () => {
            if (!isSubmittedRef.current && currentImageUrlRef.current && currentImageUrlRef.current !== originalImageUrlRef.current) {
                
                fetch(`${API_BASE}/upload`, {
                    method: 'DELETE',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}` 
                    },
                    body: JSON.stringify({ imageUrl: currentImageUrlRef.current }),
                    keepalive: true 
                }).catch(() => {});
            }
        };
    }, []);

    const cleanNutritionData = (nutData: any) => {
        const cleaned: any = {};
        for (const key in nutData) {
            if (key === 'fat') {
                const fatObj: any = {};
                for (const fatKey in nutData.fat) {
                    if (nutData.fat[fatKey] !== '') fatObj[fatKey] = nutData.fat[fatKey];
                }
                if (Object.keys(fatObj).length > 0) cleaned.fat = fatObj;
            } else if (nutData[key] !== '') {
                cleaned[key] = nutData[key];
            }
        }
        return cleaned;
    };

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        setSaving(true);
        isSubmittedRef.current = true;

        try {
            const cleanedData = {
                ...formData,
                nutrition: cleanNutritionData(formData.nutrition),
                ingredients: formData.ingredients
                                .filter(ing => ing.ingredientId && ing.amount && ing.unitId)
                                .map(({ id, ...rest }) => rest)
            };

            const isEdit = !!formData.id;
            const endpoint = isEdit ? `${API_BASE}/recipes/${formData.id}` : `${API_BASE}/recipes`;
            
            const response = await fetchWithAuth(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cleanedData, userId })
            });

            if (response.ok) {
                navigate('/discovery'); 
            } else {
                toast.error(`Failed to ${isEdit ? 'update' : 'save'} recipe.`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !taxonomy) return <div className="p-20 text-center text-gray-400 font-bold animate-pulse">Warming up the oven...</div>;

    const availableSubcategories = taxonomy.categories.find(
        cat => cat.id === formData.categoryId
    )?.subcategories || [];
    const isEditMode = !!formData.id;

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 pb-32 animate-in fade-in">
            <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-md pb-4 mb-8 border-b border-gray-100 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        {isEditMode ? 'Edit Recipe' : 'Draft Recipe'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isEditMode ? 'Tweak your culinary masterpiece.' : 'Create a new culinary masterpiece.'}
                    </p>
                </div>
                <button type="submit" disabled={saving} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50">
                    {saving ? 'Saving...' : (isEditMode ? 'Update Recipe' : 'Save Recipe')}
                </button>
            </div>

            <div className="space-y-10">
                {/* Basic Information */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-800 border-b-2 border-gray-200 pb-2">1. Basics</h2>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Recipe Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Grandma's Lasagna" className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Recipe Image</label>

                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 shrink-0 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden relative group">
                                {formData.imageUrl ? (
                                    <>
                                        <img src={getNetworkImageUrl(formData.imageUrl)} alt="Recipe Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Replace</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-4xl text-gray-300">📷</span>
                                )}

                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <span className="animate-spin text-2xl">⏳</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <input type="file" id="image-upload" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                <label htmlFor="image-upload" className={`inline-block px-6 py-3 rounded-xl font-bold cursor-pointer transition-all border-2 ${isUploading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:text-orange-600 shadow-sm hover:shadow-md'}`}>
                                    {isUploading ? 'Uploading...' : formData.imageUrl ? 'Choose Different Image' : 'Select Image File'}
                                </label>
                                <p className="text-xs font-medium text-gray-400 mt-3">
                                    Supports JPG, PNG, or WEBP. You can also press <kbd className="bg-gray-200 px-1 rounded text-gray-700">Ctrl+V</kbd> to paste an image anywhere on this page.
                                </p>
                                <p className="text-xs font-medium text-gray-400 mt-1">
                                    <kbd className="text-orange-500">Max Image Size: 10MB</kbd>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Summary</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="A brief description of this dish..." rows={3} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-none" />
                    </div>
                </section>

                {/* Classification */}
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

                {/* Timing & Yield */}
                <section className="bg-orange-50/50 p-8 rounded-3xl border-2 border-orange-100 space-y-6">
                    <h2 className="text-xl font-black text-orange-900 border-b-2 border-orange-200/50 pb-2">3. Time & Yield</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Prep Time (min)</label>
                            <input type="number" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Cook Time (min)</label>
                            <input type="number" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 mb-2">Servings</label>
                            <input type="number" name="servings" value={formData.servings} onChange={handleChange} min="1" className="w-full p-4 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none bg-white" />
                        </div>
                    </div>
                </section>

                {/* Ingredients (DND Implementation) */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <div className="flex justify-between items-end border-b-2 border-gray-200 pb-2">
                        <h2 className="text-xl font-black text-gray-800">4. Ingredients *</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formData.ingredients.length} Items</span>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={formData.ingredients.map(ing => ing.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {formData.ingredients.map((ing, index) => (
                                    <SortableIngredientRow
                                        key={ing.id}
                                        id={ing.id}
                                        index={index}
                                        ingredient={ing}
                                        taxonomy={taxonomy}
                                        handleIngredientChange={handleIngredientChange}
                                        removeIngredientRow={removeIngredientRow}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <button type="button" onClick={addIngredientRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-white hover:border-orange-300 hover:text-orange-600 transition-all">
                        + Add Another Ingredient
                    </button>
                </section>

                {/* Instructions & Notes */}
                <section className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-800 border-b-2 border-gray-200 pb-2">5. Directions</h2>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Instructions * <span className="text-gray-400 font-normal">(Separate steps with a new line)</span></label>
                        <textarea required name="instructions" value={formData.instructions} onChange={handleChange} rows={8} className="w-full p-5 rounded-2xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-y leading-relaxed" placeholder="1. Preheat the oven...&#10;2. Mix the dry ingredients..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chef's Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={6}
                            className="w-full p-5 rounded-2xl border-2 border-gray-200 focus:border-orange-500 outline-none resize-y bg-yellow-50/30 focus:bg-white transition-colors" // Changed resize-none to resize-y
                            placeholder="Any special tips, substitute suggestions, or storage advice?"
                        />
                    </div>
                </section>

                {/* Nutrition (Optional & Expandable) */}
                <AddNutrition
                    nutrition={formData.nutrition}
                    handleNutritionChange={handleNutritionChange}
                />
            </div>
        </form>
    );
};

export default AddRecipe;
