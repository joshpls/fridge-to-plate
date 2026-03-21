// src/components/admin/RecipesTab.tsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Search, Trash2, ExternalLink, ArrowUpDown } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';

export const RecipesTab = () => {
    const { token } = useAuth();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortField, setSortField] = useState<'createdAt' | 'name' | 'author'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchRecipes = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/recipes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.status === 'success') {
                setRecipes(result.data);
            }
        } catch (error) {
            toast.error("Failed to load recipes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [token]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE}/admin/recipes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success("Recipe deleted");
                setRecipes(prev => prev.filter(r => r.id !== id));
            } else {
                toast.error("Failed to delete recipe");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const toggleSort = (field: 'createdAt' | 'name' | 'author') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Derived state for filtering and sorting
    const filteredAndSortedRecipes = useMemo(() => {
        return recipes
            .filter(r => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = 
                    r.name.toLowerCase().includes(searchLower) || 
                    r.author?.email.toLowerCase().includes(searchLower) ||
                    r.subcategory?.name?.toLowerCase().includes(searchLower);
                
                const matchesCategory = categoryFilter ? r.category?.name === categoryFilter : true;
                
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                let valA, valB;
                
                if (sortField === 'name') {
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                } else if (sortField === 'author') {
                    valA = a.author?.email.toLowerCase() || '';
                    valB = b.author?.email.toLowerCase() || '';
                } else {
                    valA = new Date(a.createdAt).getTime();
                    valB = new Date(b.createdAt).getTime();
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [recipes, searchTerm, categoryFilter, sortField, sortOrder]);

    // Extract unique categories for the dropdown
    const uniqueCategories = Array.from(new Set(recipes.map(r => r.category?.name).filter(Boolean)));

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading recipes...</div>;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-black text-gray-900">Recipe Management ({recipes.length})</h2>
                
                {/* Filter Bar */}
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search name, author, subcategory..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-4 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-1">Recipe <ArrowUpDown size={12} /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('author')}>
                                <div className="flex items-center gap-1">Author <ArrowUpDown size={12} /></div>
                            </th>
                            <th className="p-4">Category</th>
                            <th className="p-4 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('createdAt')}>
                                <div className="flex items-center gap-1">Created <ArrowUpDown size={12} /></div>
                            </th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAndSortedRecipes.length > 0 ? (
                            filteredAndSortedRecipes.map(recipe => (
                                <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            {recipe.name}
                                            <Link to={`/recipe/${recipe.slug}`} target="_blank" className="text-gray-400 hover:text-orange-500">
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{recipe.author?.email}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">{recipe.category?.name || 'N/A'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase">{recipe.subcategory?.name || ''}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 whitespace-nowrap">
                                        {new Date(recipe.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(recipe.id, recipe.name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Recipe"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                    No recipes found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
