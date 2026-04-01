// src/components/admin/IngredientsTab.tsx
import { useState, useEffect } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import type { Ingredient } from '../../models/Recipe';

export const IngredientsTab = () => {
    const { confirm } = useConfirm();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Add Form State
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIsStaple, setNewIsStaple] = useState(false);
    
    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', isStaple: false });
    
    const [loading, setLoading] = useState(true);

    const loadData = async (force = false) => {
        setLoading(true);
        const data = await taxonomyService.getTaxonomy(force);
        if (data) {
            setIngredients(data.ingredients);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const filteredIngredients = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Handlers ---
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIngredientName.trim()) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newIngredientName, isStaple: newIsStaple })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
                setNewIngredientName('');
                setNewIsStaple(false);
            }
        } catch (err) { console.error(err); }
    };

    const startEdit = (ing: Ingredient) => {
        setEditingId(ing.id);
        setEditForm({ name: ing.name, isStaple: ing.isStaple || false });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editForm.name.trim()) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
                setEditingId(null);
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete this ingredient?",
            message: `Are you sure you want to delete this ingredient?`,
            confirmText: "Yes",
            variant: "danger"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients/${id}`, {
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

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading ingredients...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex-1 flex gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 items-center">
                    <input 
                        type="text" 
                        placeholder="New Ingredient Name..." 
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:border-orange-500 dark:focus:border-orange-500 text-gray-900 dark:text-white text-sm outline-none transition-colors"
                    />
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer whitespace-nowrap select-none">
                        <input 
                            type="checkbox" 
                            checked={newIsStaple}
                            onChange={(e) => setNewIsStaple(e.target.checked)}
                            className="w-4 h-4 text-orange-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-orange-500 dark:focus:ring-offset-gray-900"
                        />
                        Pantry Staple
                    </label>
                    <button type="submit" className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors active:scale-95">
                        Add
                    </button>
                </form>

                {/* Search Bar */}
                <div className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <input 
                        type="text" 
                        placeholder="🔍 Search ingredients..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:border-orange-500 dark:focus:border-orange-500 text-gray-900 dark:text-white text-sm outline-none transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    {filteredIngredients.map(ing => (
                        <div key={ing.id} className="group flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800/50 last:border-0 transition-colors">
                            
                            {/* IF EDITING */}
                            {editingId === ing.id ? (
                                <div className="flex flex-1 items-center gap-4 flex-wrap sm:flex-nowrap">
                                    <input 
                                        type="text" 
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="flex-1 min-w-[150px] p-1.5 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-500/50 rounded focus:border-orange-500 dark:focus:border-orange-400 text-gray-900 dark:text-white text-sm outline-none transition-colors"
                                        autoFocus
                                    />
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.isStaple}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, isStaple: e.target.checked }))}
                                            className="w-4 h-4 text-orange-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-orange-500"
                                        />
                                        Staple
                                    </label>
                                    <div className="flex gap-2 ml-auto sm:ml-4">
                                        <button onClick={() => handleSaveEdit(ing.id)} className="text-sm font-bold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 px-3 py-1.5 rounded hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors">Save</button>
                                        <button onClick={cancelEdit} className="text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                            /* IF NOT EDITING */
                                <>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-800 dark:text-gray-200 font-medium">{ing.name}</span>
                                        {ing.isStaple && (
                                            <span className="bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                Staple
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(ing)} className="text-sm font-bold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(ing.id)} className="text-sm font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {filteredIngredients.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">No ingredients found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
