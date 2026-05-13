import { useState, useEffect, useMemo } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';
import { Search, Plus, Trash2, Edit2, Layers, CheckCircle2, Circle, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'ingredients' | 'categories';
type SortField = 'name' | 'category';
type SortOrder = 'asc' | 'desc';

export const IngredientsTab = () => {
    const { confirm, prompt } = useConfirm();
    const [activeTab, setActiveTab] = useState<Tab>('ingredients');
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- Filter & Sort State ---
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<any>(null);
    const [ingForm, setIngForm] = useState({ name: '', categoryId: '', isDefaultStaple: false });

    const loadData = async (force = false) => {
        setLoading(true);
        const data = await taxonomyService.getTaxonomy(force);
        if (data) {
            setIngredients(data.ingredients || []);
            setCategories(data.ingredientCategories || []);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    // --- Category Actions ---
    const handleAddCategory = async () => {
        const name = await prompt({
            title: "New Ingredient Category Name",
            message: "Add a name for this Ingredient Category:",
            defaultValue: "",
            placeholder: "e.g., Produce, Dairy, Proteins",
            confirmText: "Save Changes"
        });

        if (!name) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredient-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                toast.success("Ingredient Category created");
                loadData(true);
            } else throw new Error();
        } catch (err) {
            toast.error("Failed to create category");
        }
    };

    const handleEditCategory = async (cat: any) => {
        const newName = await prompt({
            title: "Edit Ingredient Category",
            message: "Update the name for this Ingredient Category:",
            defaultValue: cat.name,
            placeholder: "e.g., Breakfast",
            confirmText: "Save Changes"
        });

        if (!newName || newName === cat.name) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredient-categories/${cat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                toast.success("Category updated");
                loadData(true);
            } else throw new Error();
        } catch (err) {
            toast.error("Failed to update category");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Category?",
            message: `This will un-categorize all ingredients within it.`,
            confirmText: "Yes",
            variant: "danger"
        });
        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredient-categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Category deleted");
                loadData(true);
            } else throw new Error();
        } catch (err) {
            toast.error("Failed to delete category");
        }
    };

    // --- Ingredient Actions ---
    const openIngModal = (ing?: any) => {
        if (ing) {
            setEditingIngredient(ing);
            setIngForm({ 
                name: ing.name, 
                categoryId: ing.categoryId || '', 
                isDefaultStaple: ing.isDefaultStaple || false 
            });
        } else {
            setEditingIngredient(null);
            setIngForm({ name: '', categoryId: '', isDefaultStaple: false });
        }
        setIsIngredientModalOpen(true);
    };

    const handleSaveIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingIngredient 
            ? `${API_BASE}/admin/ingredients/${editingIngredient.id}` 
            : `${API_BASE}/admin/ingredients`;
        
        try {
            const res = await fetchWithAuth(url, {
                method: editingIngredient ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingForm)
            });
            if (res.ok) {
                toast.success(editingIngredient ? "Ingredient updated" : "Ingredient added");
                setIsIngredientModalOpen(false);
                loadData(true);
            } else throw new Error();
        } catch (err) {
            toast.error("Error saving ingredient");
        }
    };

    const handleDeleteIngredient = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Ingredient?",
            message: `This action cannot be undone and may affect recipes using it.`,
            confirmText: "Yes",
            variant: "danger"
        });
        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/ingredients/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Ingredient removed");
                loadData(true);
            } else throw new Error();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    // --- Sort Handler ---
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // --- Filtering & Sorting Logic ---
    const filteredIngredients = useMemo(() => {
        let mappedData = ingredients.map(ing => ({
            ...ing,
            categoryName: categories.find(c => c.id === ing.categoryId)?.name || 'Uncategorized'
        }));

        // 1. Search Filter
        if (searchTerm) {
            mappedData = mappedData.filter(ing => 
                ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ing.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category Dropdown Filter
        if (selectedCategoryFilter !== 'ALL') {
            if (selectedCategoryFilter === 'UNCATEGORIZED') {
                mappedData = mappedData.filter(ing => !ing.categoryId);
            } else {
                mappedData = mappedData.filter(ing => ing.categoryId === selectedCategoryFilter);
            }
        }

        // 3. Sorting
        mappedData.sort((a, b) => {
            let comparison = 0;
            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'category') {
                comparison = a.categoryName.localeCompare(b.categoryName);
                // Fallback to name sort if categories are identical
                if (comparison === 0) comparison = a.name.localeCompare(b.name);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return mappedData;
    }, [ingredients, categories, searchTerm, selectedCategoryFilter, sortField, sortOrder]);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categories, searchTerm]);

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="inline ml-1 opacity-40 group-hover:opacity-100 transition-opacity" />;
        return sortOrder === 'asc' 
            ? <ArrowUp size={14} className="inline ml-1 text-orange-500" /> 
            : <ArrowDown size={14} className="inline ml-1 text-orange-500" />;
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-gray-400">Loading Taxonomy...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full md:w-fit">
                    <button onClick={() => setActiveTab('ingredients')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'ingredients' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}>Ingredients</button>
                    <button onClick={() => setActiveTab('categories')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}>Categories</button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Filter Dropdown (Only visible on Ingredients tab) */}
                    {activeTab === 'ingredients' && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            <select 
                                value={selectedCategoryFilter} 
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="w-full sm:w-48 pl-9 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-orange-500 transition-all text-sm font-medium appearance-none cursor-pointer text-gray-700 dark:text-gray-200"
                            >
                                <option value="ALL">All Categories</option>
                                <option value="UNCATEGORIZED">Uncategorized</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-orange-500 transition-all text-sm font-medium" />
                    </div>
                    
                    <button onClick={activeTab === 'ingredients' ? () => openIngModal() : handleAddCategory} className="bg-gray-900 dark:bg-orange-600 text-white p-2.5 flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0">
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {activeTab === 'ingredients' ? (
                    <>
                        {/* DESKTOP VIEW (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                        <th 
                                            onClick={() => handleSort('name')} 
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer group hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            Ingredient {renderSortIcon('name')}
                                        </th>
                                        <th 
                                            onClick={() => handleSort('category')} 
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer group hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            Category {renderSortIcon('category')}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Staple</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {filteredIngredients.map(ing => (
                                        <tr key={ing.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-200">{ing.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">{ing.categoryName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ing.isDefaultStaple ? <CheckCircle2 size={18} className="text-green-500 mx-auto" /> : <Circle size={18} className="text-gray-200 dark:text-gray-700 mx-auto" />}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openIngModal(ing)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteIngredient(ing.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE VIEW (Cards) */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Mobile Sort Controls */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-500 dark:text-gray-400">Sort by:</span>
                                <div className="flex gap-4">
                                    <button onClick={() => handleSort('name')} className={`font-black flex items-center gap-1 ${sortField === 'name' ? 'text-orange-600' : 'text-gray-400'}`}>
                                        Name {sortField === 'name' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                                    </button>
                                    <button onClick={() => handleSort('category')} className={`font-black flex items-center gap-1 ${sortField === 'category' ? 'text-orange-600' : 'text-gray-400'}`}>
                                        Category {sortField === 'category' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                                    </button>
                                </div>
                            </div>
                            
                            {filteredIngredients.map(ing => (
                                <div key={ing.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">{ing.name}</h4>
                                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">
                                                {ing.categoryName}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 shrink-0 ml-2">
                                            <button onClick={() => openIngModal(ing)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteIngredient(ing.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        {ing.isDefaultStaple ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md">
                                                <CheckCircle2 size={14} /> Default Staple
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400 px-2 py-1">
                                                <Circle size={14} /> Not a staple
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredIngredients.length === 0 && (
                                <div className="p-8 text-center text-gray-500 font-medium">
                                    No ingredients found matching your filters.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredCategories.map(cat => {
                            const ingredientCount = ingredients.filter(i => i.categoryId === cat.id).length;
                            return (
                                <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 shrink-0"><Layers size={20} /></div>
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-gray-100">{cat.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{ingredientCount} Ingredients</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-auto">
                                        <button onClick={() => handleEditCategory(cat)} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">Edit</button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredCategories.length === 0 && (
                            <div className="p-8 text-center text-gray-500 font-medium">
                                No categories found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isIngredientModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{editingIngredient ? 'Edit Ingredient' : 'New Ingredient'}</h3>
                        </div>
                        <form onSubmit={handleSaveIngredient} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Name</label>
                                <input required type="text" value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 ring-orange-500 outline-none font-bold text-gray-900 dark:text-gray-100" />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                                <select value={ingForm.categoryId} onChange={e => setIngForm({...ingForm, categoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 ring-orange-500 outline-none font-bold text-gray-900 dark:text-gray-100 cursor-pointer" >
                                    <option value="">Uncategorized</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${ingForm.isDefaultStaple ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <input type="checkbox" className="hidden" checked={ingForm.isDefaultStaple} onChange={e => setIngForm({...ingForm, isDefaultStaple: e.target.checked})} />
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ingForm.isDefaultStaple ? 'left-7' : 'left-1'}`} />
                                </div>
                                <span className="text-sm font-black text-gray-700 dark:text-gray-300">Default Staple Item?</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsIngredientModalOpen(false)} className="flex-1 py-3 font-black text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-gray-900 dark:bg-orange-600 text-white font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg">Save Ingredient</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
