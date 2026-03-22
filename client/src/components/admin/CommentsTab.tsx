import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Trash2, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

export const CommentsTab = () => {
    const { token } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Table State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchComments = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                sortBy,
                sortOrder
            });
            const res = await fetchWithAuth(`${API_BASE}/admin/comments?${query}`);
            const result = await res.json();
            
            if (result.status === 'success') {
                setComments(result.data.comments);
                setTotalPages(result.data.pagination.totalPages);
            }
        } catch (error) {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    // Refetch when dependencies change
    useEffect(() => { 
        // Small debounce for searching so it doesn't spam the API on every keystroke
        const delayDebounceFn = setTimeout(() => {
            fetchComments(); 
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [token, page, search, sortBy, sortOrder]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setPage(1); // Reset to page 1 on sort change
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this comment?")) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/comments/${commentId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Comment deleted");
                fetchComments(); // Refresh the current page
            }
        } catch (error) { toast.error("An error occurred"); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <h2 className="text-2xl font-black text-gray-900">Comment Moderation</h2>
                
                {/* Search Bar */}
                <div className="relative w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search comments or users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                    />
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] uppercase tracking-widest font-black cursor-pointer">
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('createdAt')}>
                                    Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4">User</th>
                                <th className="p-4">Recipe</th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('rating')}>
                                    Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading comments...</td></tr>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <tr key={comment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-500 whitespace-nowrap">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {comment.user?.alias || comment.user?.email}
                                        </td>
                                        <td className="p-4">
                                            <Link to={`/recipe/${comment.recipe?.slug}`} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1" target="_blank">
                                                {comment.recipe?.name} <ExternalLink size={12} />
                                            </Link>
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-xs truncate" title={comment.content}>
                                            {comment.rating && <span className="text-yellow-400 mr-1">★{comment.rating}</span>}
                                            {comment.content}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-500 p-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No comments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Page {page} of {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
