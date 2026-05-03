import React, { useState, useEffect, type SubmitEvent, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taxonomyService } from '../services/taxonomyService';
import { API_BASE, getNetworkImageUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { SortableIngredientRow } from '../components/recipes/SortableIngredientRow';
import { SortableSectionHeader } from '../components/recipes/SortableSectionHeader';
import { rehydrateIngredients, dehydrateIngredients } from '../utils/recipeUtils';
import { initialRecipe, Visibility, type RecipeFormData, type TaxonomyData } from '../models/Recipe';
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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { storageService } from '../services/storageService';

const AddRecipe = () => {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>(); 
    const { user } = useAuth();
    const userId = user?.id;
    const isAdmin = user?.role === 'ADMIN';
    
    const [formData, setFormData] = useState<RecipeFormData>(initialRecipe);
    const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const originalImageUrlRef = useRef<string>('');
    const currentImageUrlRef = useRef<string>('');
    const isSubmittedRef = useRef<boolean>(false);
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const initializeForm = async () => {
            try {
                const taxonomy = await taxonomyService.getTaxonomy(true);
                if (taxonomy) setTaxonomy(taxonomy);

                if (slug) {
                    const res = await fetchWithAuth(`${API_BASE}/recipes/${slug}?userId=${userId}`);
                    const result = await res.json();

                    if (result.status === 'success') {
                        const r = result.data;
                        const fetchedNutrition = r.nutrition || {};
                        const fetchedFat = fetchedNutrition.fat || {};
                        originalImageUrlRef.current = r.imageUrl || '';
                        currentImageUrlRef.current = r.imageUrl || '';

                        const uiIngredients = rehydrateIngredients(r.ingredients, true);

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
                            sourceName: r.sourceName || '',
                            sourceUrl: r.sourceUrl || '',
                            tagIds: r.tags?.map((t: any) => t.id) || [],
                            ingredients: uiIngredients, 
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
                            },
                            visibility: r.visibility || Visibility.PRIVATE
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
                return { ...prev, nutrition: { ...prev.nutrition, fat: { ...(prev.nutrition.fat || {}), [field]: value } } };
            }
            return { ...prev, nutrition: { ...prev.nutrition, [field]: field === 'calories' ? (value === '' ? '' : Number(value)) : value } };
        });
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({ ...prev, tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId] }));
    };

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const handleHeaderChange = (index: number, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], name: value };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const addSectionHeader = () => setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { id: Math.random().toString(36).substring(7), isHeader: true, name: '', sectionName: '', ingredientId: '', amount: '', unitId: '', modifierId: '' }]
    }));

    const addIngredientRow = () => setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { id: Math.random().toString(36).substring(7), ingredientId: '', name: '', sectionName: '', amount: '', unitId: '', modifierId: '' }]
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
                return { ...prev, ingredients: arrayMove(prev.ingredients, oldIndex, newIndex) };
            });
        }
    };

    const handleCreateNewIngredient = async (name: string, index: number) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, isDefaultStaple: false })
            });
            const result = await res.json();

            if (result.status === 'success') {
                const newIngredient = result.data;
                
                setTaxonomy(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        ingredients: [...prev.ingredients, newIngredient].sort((a, b) => a.name.localeCompare(b.name))
                    };
                });
                
                handleIngredientChange(index, 'ingredientId', newIngredient.id);
                toast.success(`Added ingredient: ${name}`);
                return true;
            } else {
                toast.error('Failed to create ingredient on server.');
                return false;
            }
        } catch (err) {
            console.error('Error creating ingredient:', err);
            toast.error('Network error while creating ingredient.');
            return false;
        }
    };

const uploadFileToServer = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);
    try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/upload`, { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
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
                    if (file) { e.preventDefault(); uploadFileToServer(file); break; }
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
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
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
            const finalIngredients = dehydrateIngredients(formData.ingredients);

            const cleanedData = {
                ...formData,
                nutrition: cleanNutritionData(formData.nutrition),
                ingredients: finalIngredients
            };

            const isEdit = !!formData.id;
            const endpoint = isEdit ? `${API_BASE}/recipes/${formData.id}` : `${API_BASE}/recipes`;
            
            const response = await fetchWithAuth(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cleanedData, userId })
            });

            if (response.ok) {
                storageService.cache.clearDiscoveryState();
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
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-6 pb-32 animate-in fade-in">
            
            <div className="sticky top-16 pt-4 pb-4 mb-6 sm:mb-8 z-50 bg-white dark:bg-gray-950 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isEditMode ? 'Edit Recipe' : 'Draft Recipe'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium mt-1">
                        {isEditMode ? 'Tweak your culinary masterpiece.' : 'Create a new culinary masterpiece.'}
                    </p>
                </div>
                <button type="submit" disabled={saving} className="w-full sm:w-auto bg-gray-900 dark:bg-orange-500 text-white px-8 py-3 sm:py-3.5 rounded-xl font-black hover:bg-orange-600 dark:hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 dark:shadow-none active:scale-95 disabled:opacity-50">
                    {saving ? 'Saving...' : (isEditMode ? 'Update Recipe' : 'Save Recipe')}
                </button>
            </div>

            <div className="space-y-6 sm:space-y-10">
                <section className="bg-gray-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-400 pb-2">1. Basics</h2>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Recipe Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Grandma's Lasagna" className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-orange-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Recipe Image</label>

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            <div className="w-full sm:w-32 h-40 sm:h-32 shrink-0 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex flex-col items-center justify-center overflow-hidden relative group">
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
                                    <div className="absolute inset-0 bg-white dark:bg-gray-900/80 flex items-center justify-center">
                                        <span className="animate-spin text-2xl">⏳</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 w-full text-center sm:text-left">
                                <input type="file" id="image-upload" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                <label htmlFor="image-upload" className={`inline-block w-full sm:w-auto text-center px-6 py-3 rounded-xl font-bold cursor-pointer transition-all border-2 ${isUploading ? 'bg-gray-100 text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-orange-400 hover:text-orange-600 shadow-sm hover:shadow-md'}`}>
                                    {isUploading ? 'Uploading...' : formData.imageUrl ? 'Choose Different Image' : 'Select Image File'}
                                </label>
                                <p className="text-xs font-medium text-gray-400 mt-3">
                                    Supports JPG, PNG, or WEBP. You can also press <kbd className="bg-gray-200 dark:bg-gray-900 px-1 rounded text-gray-700 dark:text-gray-300 hidden sm:inline">Ctrl+V</kbd> <span className="sm:hidden">paste</span> to paste an image.
                                </p>
                                <p className="text-xs font-medium text-gray-400 mt-1">
                                    <kbd className="text-orange-500">Max Image Size: 10MB</kbd>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Summary</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="A brief description of this dish..." rows={3} className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-orange-500 outline-none resize-y" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Original Creator (Optional)</label>
                            <input
                                type="text"
                                name="sourceName"
                                value={formData.sourceName || ''}
                                onChange={handleChange}
                                placeholder="e.g., Serious Eats or Chef John"
                                className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Source URL (Optional)</label>
                            <input
                                type="url"
                                name="sourceUrl"
                                value={formData.sourceUrl || ''}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-400 pb-2">2. Classification</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                            <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900">
                                <option value="">Select a category</option>
                                {taxonomy.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
                            <select name="subcategoryId" value={formData.subcategoryId} onChange={handleChange} disabled={!formData.categoryId} className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900 disabled:bg-gray-100">
                                <option value="">Select a subcategory</option>
                                {availableSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Dietary Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {taxonomy.tags.map(tag => (
                                <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)} className={`px-3 py-2 sm:px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.tagIds.includes(tag.id) ? 'bg-orange-100 dark:bg-orange-500/20 border-orange-400 dark:border-orange-500/50 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-orange-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-orange-900 border-b-2 border-orange-200/50 dark:border-gray-400 dark:text-gray-200 pb-2">3. Time & Yield</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-bold text-orange-800 dark:text-gray-400 mb-2">Prep Time (min)</label>
                            <input type="number" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-orange-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 dark:text-gray-400 mb-2">Cook Time (min)</label>
                            <input type="number" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-orange-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-orange-800 dark:text-gray-400 mb-2">Yields (Servings) *</label>
                            <input required type="number" name="servings" value={formData.servings} onChange={handleChange} min="1" className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-orange-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900" />
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-400 pb-2">4. Ingredients</h2>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={formData.ingredients.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {formData.ingredients.map((ing, index) => {
                                    if (ing.isHeader) {
                                        return (
                                            <SortableSectionHeader
                                                key={ing.id}
                                                id={ing.id}
                                                title={ing.name || ''}
                                                onChange={(val: string) => handleHeaderChange(index, val)}
                                                onRemove={() => removeIngredientRow(index)}
                                            />
                                        );
                                    }
                                    return (
                                        <SortableIngredientRow
                                            key={ing.id}
                                            id={ing.id}
                                            ingredient={ing}
                                            index={index}
                                            taxonomy={taxonomy}
                                            handleIngredientChange={handleIngredientChange}
                                            removeIngredientRow={removeIngredientRow}
                                            isAdmin={isAdmin}
                                            onCreateNewIngredient={handleCreateNewIngredient}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button type="button" onClick={addIngredientRow} className="w-full sm:w-auto bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-bold hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm">
                            + Add Ingredient
                        </button>
                        <button type="button" onClick={addSectionHeader} className="w-full sm:w-auto bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 px-6 py-3 rounded-xl font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all shadow-sm">
                            🏷️ Add Section Header
                        </button>
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-400 pb-2">5. Directions</h2>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Instructions * <span className="text-gray-400 font-normal block sm:inline">(Separate steps with a new line)</span></label>
                        <textarea required name="instructions" value={formData.instructions} onChange={handleChange} rows={8} className="w-full p-4 sm:p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-400 focus:border-orange-500 outline-none resize-y leading-relaxed text-sm sm:text-base" placeholder="1. Preheat the oven...&#10;2. Mix the dry ingredients..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Chef's Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-4 sm:p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-400 focus:border-orange-500 outline-none resize-y bg-yellow-50/30 dark:bg-yellow-500/10 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 transition-colors text-sm sm:text-base"
                            placeholder="Any special tips, substitute suggestions, or storage advice?"
                        />
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-gray-800 p-5 sm:p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 space-y-6">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-400 pb-2">Visibility Settings</h2>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Recipe Visibility *</label>
                        <select 
                            required 
                            name="visibility" 
                            value={formData.visibility} 
                            onChange={handleChange} 
                            className="w-full p-3.5 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-orange-500 outline-none bg-white dark:bg-gray-900"
                        >
                            {Object.values(Visibility).map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                        <p className="text-xs font-medium text-gray-400 mt-2">
                            • <strong>PRIVATE:</strong> Only you can see this recipe.
                        </p>
                        <p className="text-xs font-medium text-gray-400">
                            • <strong>HOUSEHOLD:</strong> You and other members of your current household can see this.
                        </p>
                        <p className="text-xs font-medium text-gray-400">
                            • <strong>PUBLIC:</strong> Everyone can discover and view this recipe.
                        </p>
                    </div>
                </section>

                <AddNutrition nutrition={formData.nutrition} handleNutritionChange={handleNutritionChange} />
            </div>
        </form>
    );
};

export default AddRecipe;
