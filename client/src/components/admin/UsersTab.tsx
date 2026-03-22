// src/components/admin/UsersTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Shield, User as UserIcon, Edit2, Trash2, X, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

export const UsersTab = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', alias: '', email: '' });

    // Pagination, Search, and Sort State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                sortBy,
                sortOrder
            });
            const res = await fetchWithAuth(`${API_BASE}/admin/users?${query}`);
            const result = await res.json();
            
            if (result.status === 'success') {
                // Now expecting { users, pagination } from the updated backend
                setUsers(result.data.users);
                setTotalPages(result.data.pagination.totalPages);
            }
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // Refetch when dependencies change, with a small debounce for search
    useEffect(() => { 
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(); 
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

    const handleToggleRole = async (userId: string, currentRole: string) => {
        if (userId === currentUser?.id) {
            toast.error("You cannot change your own role!");
            return;
        }

        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                toast.success(`User updated to ${newRole}`);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    // --- Edit Handlers ---
    const startEdit = (u: any) => {
        setEditingId(u.id);
        setEditForm({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            alias: u.alias || '',
            email: u.email || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (userId: string) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                toast.success("User profile updated");
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...editForm } : u));
                setEditingId(null);
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update user");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    // --- Delete Handler ---
    const handleDelete = async (userId: string, email: string) => {
        if (userId === currentUser?.id) {
            toast.error("You cannot delete your own account here.");
            return;
        }

        if (!window.confirm(`Are you absolutely sure you want to delete ${email}? This action cannot be undone.`)) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success("User deleted successfully");
                fetchUsers(); // Refresh the current page to fill the gap
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to delete user");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <h2 className="text-2xl font-black text-gray-900">User Management</h2>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] cursor-pointer">
                            <tr>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('email')}>
                                    Email / ID {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('lastName')}>
                                    Name {sortBy === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('alias')}>
                                    Alias {sortBy === 'alias' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('role')}>
                                    Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('createdAt')}>
                                    Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading users...</td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        
                                        {/* IF EDITING */}
                                        {editingId === u.id ? (
                                            <>
                                                <td className="p-4">
                                                    <input 
                                                        type="email" 
                                                        value={editForm.email} 
                                                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                                                        className="w-full p-2 border border-orange-300 rounded focus:border-orange-500 outline-none text-xs font-bold"
                                                    />
                                                </td>
                                                <td className="p-4 flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="First"
                                                        value={editForm.firstName} 
                                                        onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                                                        className="w-1/2 p-2 border border-orange-300 rounded focus:border-orange-500 outline-none text-xs font-bold"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Last"
                                                        value={editForm.lastName} 
                                                        onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                                                        className="w-1/2 p-2 border border-orange-300 rounded focus:border-orange-500 outline-none text-xs font-bold"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        value={editForm.alias} 
                                                        onChange={e => setEditForm({...editForm, alias: e.target.value})}
                                                        className="w-full p-2 border border-orange-300 rounded focus:border-orange-500 outline-none text-xs font-bold"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleSaveEdit(u.id)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors" title="Save">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors" title="Cancel">
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            /* IF NOT EDITING */
                                            <>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                                            <UserIcon size={14} />
                                                        </div>
                                                        <div className="truncate max-w-[150px]">
                                                            <p className="font-bold text-gray-900 truncate" title={u.email}>{u.email}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono truncate">{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-900 truncate max-w-[120px]">
                                                        {u.lastName || u.firstName ? `${u.lastName || ''}${u.lastName && u.firstName ? ', ' : ''}${u.firstName || ''}` : <span className="text-gray-300 italic">No Name</span>}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-900 truncate max-w-[100px]">{u.alias || <span className="text-gray-300 italic">-</span>}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 whitespace-nowrap">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={() => handleToggleRole(u.id, u.role)}
                                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Toggle Role"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => startEdit(u)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(u.id, u.email)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users found.</td>
                                </tr>
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
