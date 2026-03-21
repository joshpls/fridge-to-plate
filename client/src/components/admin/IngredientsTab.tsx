import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';

interface Ingredient {
    id: string;
    name: string;
}

export const IngredientsTab = () => {
    const { token } = useAuth();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newIngredientName, setNewIngredientName] = useState('');
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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIngredientName.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/admin/ingredients`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newIngredientName })
            });
            if (res.ok) {
                taxonomyService.invalidateCache();
                loadData(true);
                setNewIngredientName('');
            }
        } catch (err) { console.error(err); }
    };

    const handleEdit = async (id: string, currentName: string) => {
        const newName = window.prompt("Edit ingredient name:", currentName);
        if (!newName || newName === currentName) return;

        try {
            const res = await fetch(`${API_BASE}/admin/ingredients/${id}`, {
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

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this ingredient? It will fail if recipes use it.")) return;

        try {
            const res = await fetch(`${API_BASE}/admin/ingredients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
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
                <form onSubmit={handleAdd} className="flex-1 flex gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <input 
                        type="text" 
                        placeholder="New Ingredient Name..." 
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-orange-500 text-sm"
                    />
                    <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 text-sm">
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
                        className="w-full p-2 border border-gray-300 rounded focus:border-orange-500 text-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto p-2">
                    {filteredIngredients.map(ing => (
                        <div key={ing.id} className="group flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            <span className="text-gray-800 font-medium">{ing.name}</span>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(ing.id, ing.name)} className="text-sm font-bold text-blue-500 hover:text-blue-700">Edit</button>
                                <button onClick={() => handleDelete(ing.id)} className="text-sm font-bold text-red-500 hover:text-red-700">Delete</button>
                            </div>
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
