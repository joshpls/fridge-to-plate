import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Search, Trash2, ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';

export const RecipesTab = () => {
    const { confirm } = useConfirm();
    const { token } = useAuth();
    
    // Data States
    const [recipes, setRecipes] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Filter States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    
    const [sortField, setSortField] = useState<'createdAt' | 'name' | 'author'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch Categories & Users for Dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/recipes/taxonomy`);
                const result = await res.json();
                if (result.status === 'success') setCategories(result.data.categories || []);
            } catch (error) {
                console.error("Failed to load categories");
            }
        };
        const fetchUsers = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/admin/users?limit=1000`);
                const result = await res.json();
                if (result.status === 'success') {
                    setUsers(result.data.users || []);
                }
            } catch (error) {
                console.error("Failed to load users");
            }
        };
        if (token) {
            fetchCategories();
            fetchUsers();
        }
    }, [token]);

    const handleAuthorChange = async (recipeId: string, newUserId: string) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/recipes/${recipeId}/author`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newUserId })
            });
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                toast.success("Recipe author updated");
                setRecipes(recipes.map(r => r.id === recipeId ? result.data : r));
            } else {
                toast.error(result.message || "Failed to update recipe author");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page to 1 when category or sort changes
    useEffect(() => {
        setPage(1);
    }, [categoryFilter, sortField, sortOrder]);

    // Fetch Paginated Recipes
    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                category: categoryFilter,
                sortBy: sortField,
                sortOrder: sortOrder
            });

            const res = await fetchWithAuth(`${API_BASE}/admin/recipes?${params.toString()}`);
            const result = await res.json();
            
            if (result.status === 'success') {
                setRecipes(result.data.recipes);
                setTotalPages(result.data.pagination.totalPages);
                setTotalItems(result.data.pagination.total);
            }
        } catch (error) {
            toast.error("Failed to load recipes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, categoryFilter, sortField, sortOrder, token]);

    const handleDelete = async (id: string, name: string) => {
        const isConfirmed = await confirm({
            title: "Delete this Recipe?",
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: "Yes",
            variant: "danger"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/recipes/${id}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                toast.success("Recipe deleted");
                fetchRecipes(); // Refresh current page
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

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800/50">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white shrink-0">
                    Recipes {totalItems > 0 && <span className="text-gray-400 text-sm ml-2">({totalItems})</span>}
                </h2>
                
                <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search name, author..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full sm:w-auto py-2 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && recipes.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-bold animate-pulse">Loading recipes...</div>
            ) : recipes.length === 0 ? (
                <div className="p-12 text-center text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    No recipes found matching your filters.
                </div>
            ) : (
                <>
                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800/50">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:text-gray-900 dark:text-white" onClick={() => toggleSort('name')}>
                                        <div className="flex items-center gap-1">Recipe <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-gray-900 dark:text-white" onClick={() => toggleSort('author')}>
                                        <div className="flex items-center gap-1">Author <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Visibility</th>
                                    <th className="p-4 cursor-pointer hover:text-gray-900 dark:text-white" onClick={() => toggleSort('createdAt')}>
                                        <div className="flex items-center gap-1">Created <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recipes.map(recipe => (
                                    <tr key={recipe.id} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {recipe.name}
                                                <Link to={`/recipe/${recipe.slug}`} target="_blank" className="text-gray-400 hover:text-orange-500">
                                                    <ExternalLink size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={recipe.author?.id || ''}
                                                onChange={(e) => handleAuthorChange(recipe.id, e.target.value)}
                                                className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer max-w-[200px] truncate focus:ring-2 focus:ring-orange-500"
                                            >
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.email}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{recipe.category?.name || 'N/A'}</span>
                                                <span className="text-[10px] text-gray-400 uppercase">{recipe.subcategory?.name || ''}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-bold uppercase truncate max-w-[10px]">{recipe.visibility}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(recipe.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(recipe.id, recipe.name)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden space-y-4">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col gap-3 relative">
                                <div className="pr-8">
                                    <Link to={`/recipe/${recipe.slug}`} target="_blank" className="font-black text-gray-900 dark:text-white text-base hover:text-orange-600 transition-colors line-clamp-2">
                                        {recipe.name}
                                    </Link>
                                    <div className="mt-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Author</label>
                                        <select
                                            value={recipe.author?.id || ''}
                                            onChange={(e) => handleAuthorChange(recipe.id, e.target.value)}
                                            className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer truncate focus:ring-2 focus:ring-orange-500"
                                        >
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2 py-1 rounded-md inline-block w-max">
                                            {recipe.category?.name || 'Uncategorized'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                                            {recipe.visibility}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {new Date(recipe.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleDelete(recipe.id, recipe.name)}
                                        className="text-gray-400 hover:text-red-500 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors absolute top-4 right-4"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                Page <span className="text-gray-900 dark:text-white">{page}</span> of <span className="text-gray-900 dark:text-white">{totalPages}</span>
                            </span>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
