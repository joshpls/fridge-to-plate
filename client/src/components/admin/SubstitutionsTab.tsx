import { useState, useEffect, useMemo } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';
import { Search, Plus, Trash2, Edit2, Hexagon, CheckCircle2, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const SubstitutionsTab = () => {
    const { confirm } = useConfirm();
    const [groups, setGroups] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [form, setForm] = useState({ name: '', ingredientIds: [] as string[] });

    const loadData = async (force = false) => {
        setLoading(true);
        const [taxonomy, subRes] = await Promise.all([
            taxonomyService.getTaxonomy(force),
            fetchWithAuth(`${API_BASE}/admin/substitutions`) 
        ]);

        if (taxonomy) setIngredients(taxonomy.ingredients || []);
        if (subRes.ok) {
            const result = await subRes.json();
            setGroups(result.data || []);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const openModal = (group?: any) => {
        if (group) {
            setEditingGroup(group);
            setForm({ 
                name: group.name, 
                ingredientIds: group.ingredients.map((i: any) => i.id) 
            });
        } else {
            setEditingGroup(null);
            setForm({ name: '', ingredientIds: [] });
        }
        setIsModalOpen(true);
    };

    const toggleIngredientInForm = (id: string) => {
        setForm(prev => ({
            ...prev,
            ingredientIds: prev.ingredientIds.includes(id)
                ? prev.ingredientIds.filter(i => i !== id)
                : [...prev.ingredientIds, id]
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.ingredientIds.length < 2) {
            return toast.error("A group needs at least 2 ingredients");
        }

        const url = editingGroup 
            ? `${API_BASE}/admin/substitutions/${editingGroup.id}` 
            : `${API_BASE}/admin/substitutions`;
        
        try {
            const res = await fetchWithAuth(url, {
                method: editingGroup ? 'PUT' : 'POST',
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast.success("Substitution group saved");
                setIsModalOpen(false);
                loadData(true);
            }
        } catch (err) {
            toast.error("Error saving group");
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Group?",
            message: `Ingredients will remain, but they will no longer be linked as substitutes.`,
            confirmText: "Yes",
            variant: "danger"
        });
        if (isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/substitutions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Group deleted");
                loadData(true);
            }
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredIngredients = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-8 text-center text-gray-400 font-black animate-pulse uppercase tracking-widest">Loading Smart Groups...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Smart Substitutions</h2>
                    <p className="text-xs text-gray-500 font-bold">Group similar items to prevent unnecessary shopping list alerts.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 ring-orange-500/20"
                        />
                    </div>
                    <button onClick={() => openModal()} className="bg-gray-900 dark:bg-orange-600 text-white p-2 rounded-xl shadow-lg hover:scale-105 transition-transform">
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Hexagon className="text-orange-500 fill-orange-500/10" size={20} />
                                    <h3 className="font-black text-gray-800 dark:text-gray-200">{group.name}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(group)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(group.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {group.ingredients.map((ing: any) => (
                                    <span key={ing.id} className="text-[10px] font-bold px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-md border border-gray-100 dark:border-gray-700">
                                        {ing.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Multi-Select Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-black">{editingGroup ? 'Edit Group' : 'New Smart Group'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Group Name</label>
                                    <input
                                        required
                                        placeholder="e.g. Cooking Fats, Citrus Acids..."
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl font-bold outline-none focus:ring-2 ring-orange-500"
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col h-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                                        Select Ingredients ({form.ingredientIds.length} selected)
                                    </label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Filter ingredients..." 
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm"
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] p-1">
                                        {filteredIngredients.map(ing => {
                                            const isSelected = form.ingredientIds.includes(ing.id);
                                            return (
                                                <button
                                                    key={ing.id}
                                                    type="button"
                                                    onClick={() => toggleIngredientInForm(ing.id)}
                                                    className={`text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                                        isSelected 
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                                                        : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-orange-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {ing.name}
                                                    </span>
                                                    {isSelected && <CheckCircle2 size={14} className="text-orange-500 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-black text-gray-500">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-gray-900 dark:bg-orange-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform">
                                    Save Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
