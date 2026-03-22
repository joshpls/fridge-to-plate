// src/components/admin/IngredientsTab.tsx
import { useState, useEffect } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

interface Ingredient {
    id: string;
    name: string;
    isStaple: boolean;
}

export const IngredientsTab = () => {
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
        if (!window.confirm("Delete this ingredient? It will fail if recipes use it.")) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients/${id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
            } else {
                alert(result.message);
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading ingredients...</div>;

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex-1 flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 items-center">
                    <input 
                        type="text" 
                        placeholder="New Ingredient Name..." 
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-orange-500 text-sm outline-none"
                    />
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer whitespace-nowrap">
                        <input 
                            type="checkbox" 
                            checked={newIsStaple}
                            onChange={(e) => setNewIsStaple(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                        />
                        Pantry Staple
                    </label>
                    <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 text-sm transition-colors">
                        Add
                    </button>
                </form>

                {/* Search Bar */}
                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <input 
                        type="text" 
                        placeholder="🔍 Search ingredients..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:border-orange-500 text-sm outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto p-2">
                    {filteredIngredients.map(ing => (
                        <div key={ing.id} className="group flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            
                            {/* IF EDITING */}
                            {editingId === ing.id ? (
                                <div className="flex flex-1 items-center gap-4">
                                    <input 
                                        type="text" 
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="flex-1 p-1.5 border border-orange-300 rounded focus:border-orange-500 text-sm outline-none"
                                        autoFocus
                                    />
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.isStaple}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, isStaple: e.target.checked }))}
                                            className="w-4 h-4 text-orange-600 rounded"
                                        />
                                        Staple
                                    </label>
                                    <div className="flex gap-2 ml-4">
                                        <button onClick={() => handleSaveEdit(ing.id)} className="text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">Save</button>
                                        <button onClick={cancelEdit} className="text-sm font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                            /* IF NOT EDITING */
                                <>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-800 font-medium">{ing.name}</span>
                                        {ing.isStaple && (
                                            <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                Staple
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(ing)} className="text-sm font-bold text-blue-500 hover:text-blue-700">Edit</button>
                                        <button onClick={() => handleDelete(ing.id)} className="text-sm font-bold text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {filteredIngredients.length === 0 && (
                        <div className="p-4 text-center text-gray-500">No ingredients found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
