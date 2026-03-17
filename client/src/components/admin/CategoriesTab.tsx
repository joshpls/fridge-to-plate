// src/components/admin/CategoriesTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taxonomyService } from '../../services/taxonomyService';

interface Subcategory {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    subcategories: Subcategory[];
}

export const CategoriesTab = () => {
    const { token } = useAuth();
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
            const res = await fetch('http://localhost:5000/api/admin/categories', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
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
            const res = await fetch(`http://localhost:5000/api/admin/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
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
        const newName = window.prompt("Edit category name:", currentName);
        if (!newName || newName === currentName) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm("Delete this category? This might fail if recipes are using it.")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            } else {
                alert(result.message); // Displays the "Cannot delete: in use" message
            }
        } catch (err) { console.error(err); }
    };

    const handleEditSubcategory = async (id: string, currentName: string) => {
        const newName = window.prompt("Edit category name:", currentName);
        if (!newName || newName === currentName) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/subcategories/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteSubcategory = async (id: string) => {
        if (!window.confirm("Delete this category? This might fail if recipes are using it.")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/subcategories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            } else {
                alert(result.message); // Displays the "Cannot delete: in use" message
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading taxonomy...</div>;

    return (
        <div className="space-y-6">
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <input 
                    type="text" 
                    placeholder="New Category Name..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-sm"
                />
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-sm text-sm">
                    Add Category
                </button>
            </form>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                    <div key={category.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                            <h3 className="font-bold text-gray-800">{category.name}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditCategory(category.id, category.name)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                <button onClick={() => handleDeleteCategory(category.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-2 mb-6">
                            {category.subcategories.map(sub => (
                                <div key={sub.id} className="group flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="text-sm text-gray-600">{sub.name}</span>
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