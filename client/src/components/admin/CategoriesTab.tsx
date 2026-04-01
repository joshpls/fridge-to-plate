// src/components/admin/CategoriesTab.tsx
import { useState, useEffect } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import type { Category } from '../../models/Recipe';

export const CategoriesTab = () => {
    const { confirm, prompt } = useConfirm();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubcatName, setNewSubcatName] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    

    const loadData = async (force = false) => {
        setLoading(true);
        const data = await taxonomyService.getTaxonomy(force);
        if (data) {
            setCategories(data.categories);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/categories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ name: newCategoryName })
            });
            const result = await res.json();
            if (result.status === 'success') {
                taxonomyService.invalidateCache();
                setCategories([...categories, { ...result.data, subcategories: [] }]);
                setNewCategoryName('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSubcategory = async (categoryId: string) => {
        if (!newSubcatName.trim()) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ name: newSubcatName })
            });
            const result = await res.json();
            if (result.status === 'success') {
                taxonomyService.invalidateCache();
                setCategories(categories.map(cat => 
                    cat.id === categoryId 
                        ? { ...cat, subcategories: [...cat.subcategories, result.data] }
                        : cat
                ));
                setNewSubcatName('');
                setActiveCategoryId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditCategory = async (id: string, currentName: string) => {
        const newName = await prompt({
            title: "Edit Category",
            message: "Update the name for this category:",
            defaultValue: currentName,
            placeholder: "e.g., Breakfast",
            confirmText: "Save Changes"
        });

        if (!newName || newName === currentName) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteCategory = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete this category?",
            message: `Are you sure you want to delete this category?`,
            confirmText: "Yes",
            variant: "danger"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/categories/${id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            } else {
                toast.error(result.message); // Displays the "Cannot delete: in use" message
            }
        } catch (err) { console.error(err); }
    };

    const handleEditSubcategory = async (id: string, currentName: string) => {
        const newName = await prompt({
            title: "Edit Subcategory",
            message: "Update the name for this subcategory:",
            defaultValue: currentName,
            placeholder: "e.g., Toast",
            confirmText: "Save Changes"
        });

        if (!newName || newName === currentName) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/subcategories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteSubcategory = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete this subcategory?",
            message: `Are you sure you want to delete this subcategory?`,
            confirmText: "Yes",
            variant: "danger"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/subcategories/${id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            } else {
                toast.error(result.message);
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">Loading taxonomy...</div>;

    return (
        <div className="space-y-6">
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <input 
                    type="text" 
                    placeholder="New Category Name..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-sm"
                />
                <button type="submit" className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold  transition-colors shadow-sm text-sm">
                    Add Category
                </button>
            </form>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                    <div key={category.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                            <h3 className="font-bold text-gray-800 dark:text-white">{category.name}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditCategory(category.id, category.name)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                <button onClick={() => handleDeleteCategory(category.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-2 mb-6">
                            {category.subcategories.map(sub => (
                                <div key={sub.id} className="group flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                    <span className="text-sm text-gray-600 dark:text-gray-200">{sub.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditSubcategory(sub.id, sub.name)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                        <button onClick={() => handleDeleteSubcategory(sub.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {activeCategoryId === category.id ? (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Subcategory..." 
                                    value={newSubcatName}
                                    onChange={(e) => setNewSubcatName(e.target.value)}
                                    className="flex-1 p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-orange-500"
                                />
                                <button 
                                    onClick={() => handleAddSubcategory(category.id)}
                                    className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black"
                                >
                                    Add
                                </button>
                                <button 
                                    onClick={() => { setActiveCategoryId(null); setNewSubcatName(''); }}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setActiveCategoryId(category.id)}
                                className="text-xs font-bold text-orange-500 hover:text-orange-700 flex items-center gap-1"
                            >
                                <span className="text-lg">+</span> Add Subcategory
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};