// src/components/admin/UsersTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { toast } from 'react-hot-toast';
import { Shield, User as UserIcon, Edit2, Trash2, X, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

export const UsersTab = () => {
    const { token, user: currentUser } = useAuth();
    const { confirm } = useConfirm();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', alias: '', email: '' });

    // Role Modal State
    const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('USER');

    // Pagination, Search, and Sort State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('lastActiveAt');
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

    const openRoleModal = (u: any) => {
        if (u.id === currentUser?.id) {
            toast.error("You cannot change your own role!");
            return;
        }
        setRoleModalUser(u);
        setSelectedRole(u.role || 'USER');
    };

    const handleSaveRole = async () => {
        if (!roleModalUser) return;
        const userId = roleModalUser.id;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole })
            });

            if (res.ok) {
                toast.success(`User role updated to ${selectedRole}`);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
                setRoleModalUser(null);
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update role");
            }
        } catch (error) {
            toast.error("Network error");
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

        const isConfirmed = await confirm({
            title: "Delete User?",
            message: `Are you sure you want to permanently delete ${email}?`,
            confirmText: "Yes, Delete User",
            variant: "danger"
        });

        if (!isConfirmed) return;

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

    // Helper to determine if user is online (activity within the last 15 minutes)
    const isOnline = (lastActiveAt?: string) => {
        if (!lastActiveAt) return false;
        return (Date.now() - new Date(lastActiveAt).getTime()) < 15 * 60 * 1000;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">User Management</h2>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-orange-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/50 overflow-hidden">
                <div className="overflow-x-auto min-h-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] cursor-pointer whitespace-nowrap">
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
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('lastActiveAt')}>
                                    Last Active {sortBy === 'lastActiveAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 hover:text-orange-500 transition-colors" onClick={() => handleSort('createdAt')}>
                                    Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading users...</td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        
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
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 dark:text-gray-400 rounded-md text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                                                    {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
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
                                                        <div className="relative">
                                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                                                <UserIcon size={14} />
                                                            </div>
                                                            {/* Online Indicator Dot */}
                                                            {isOnline(u.lastActiveAt) && (
                                                                <span 
                                                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" 
                                                                    title="Online">
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="truncate max-w-37.5">
                                                            <p className="font-bold text-gray-900 dark:text-white truncate" title={u.email}>{u.email}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono truncate">{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-30">
                                                        {u.lastName || u.firstName ? `${u.lastName || ''}${u.lastName && u.firstName ? ', ' : ''}${u.firstName || ''}` : <span className="text-gray-300 italic">No Name</span>}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-25">{u.alias || <span className="text-gray-300 italic">-</span>}</p>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => openRoleModal(u)}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer shadow-sm ${u.role === 'ROOT' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30' :
                                                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30' :
                                                                    u.role === 'TRUSTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                                                                        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                                                            }`}
                                                        title="Click to change role"
                                                        disabled={u.role === 'ROOT'}
                                                    >
                                                        <Shield size={10} />
                                                        {u.role}
                                                    </button>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {u.lastActiveAt ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                                {isOnline(u.lastActiveAt) ? <span className="text-green-500">Active Now</span> : new Date(u.lastActiveAt).toLocaleDateString()}
                                                            </span>
                                                            {!isOnline(u.lastActiveAt) && (
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(u.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Never</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={() => startEdit(u)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/15 rounded-lg transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(u.id, u.email)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-lg transition-colors"
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
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800/50">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Page {page} of {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Role Selection Modal */}
            {roleModalUser && (
                <div 
                    className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setRoleModalUser(null); }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl dark:border-gray-800 dark:shadow-none transform transition-all">
                        <div className="p-8 relative">
                            <button 
                                onClick={() => setRoleModalUser(null)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15 text-orange-500">
                                    <Shield size={32} />
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                                    Change User Role
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mb-6 truncate max-w-70" title={roleModalUser.email}>
                                    {roleModalUser.email}
                                </p>

                                <div className="w-full space-y-3">
                                    {[
                                        { 
                                            role: 'USER', 
                                            label: 'User', 
                                            desc: 'Standard account permissions', 
                                            color: 'border-blue-200 bg-blue-50/50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300' 
                                        },
                                        { 
                                            role: 'TRUSTED', 
                                            label: 'Trusted', 
                                            desc: 'Trusted contributor permissions', 
                                            color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300' 
                                        },
                                        { 
                                            role: 'ADMIN', 
                                            label: 'Admin', 
                                            desc: 'Full administrative control over the platform', 
                                            color: 'border-purple-200 bg-purple-50/50 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-300' 
                                        }
                                    ].map((item) => (
                                        <button
                                            key={item.role}
                                            type="button"
                                            onClick={() => setSelectedRole(item.role)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                                selectedRole === item.role 
                                                    ? `\${item.color} ring-2 ring-orange-500/50 shadow-md` 
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wider">{item.label}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                selectedRole === item.role ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 dark:border-gray-700'
                                            }`}>
                                                {selectedRole === item.role && <Check size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setRoleModalUser(null)}
                                className="flex-1 px-4 py-3.5 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors tracking-widest uppercase text-sm cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRole}
                                className="flex-1 px-4 py-3.5 text-white font-black rounded-2xl shadow-xl bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 transition-all tracking-widest uppercase text-sm transform hover:-translate-y-0.5 cursor-pointer"
                            >
                                Save Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
