// src/components/admin/UsersTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Shield, User as UserIcon, Mail, Calendar, Edit2, Trash2, X, Check } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

export const UsersTab = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', alias: '', email: '' });

    const fetchUsers = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/users`);
            const result = await res.json();
            if (result.status === 'success') setUsers(result.data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [token]);

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
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to delete user");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading users...</div>;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6">User Management</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-4">Email / ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Alias</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
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
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <UserIcon size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{u.email}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">
                                                {u.lastName || u.firstName ? `${u.lastName || ''}${u.lastName && u.firstName ? ', ' : ''}${u.firstName || ''}` : <span className="text-gray-300 italic">No Name</span>}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{u.alias || <span className="text-gray-300 italic">-</span>}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleRole(u.id, u.role)}
                                                    className="text-[10px] font-black text-orange-500 hover:bg-orange-50 px-3 py-2 rounded-xl transition-all"
                                                    title="Toggle Role"
                                                >
                                                    <Shield size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => startEdit(u)}
                                                    className="text-[10px] font-black text-blue-500 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(u.id, u.email)}
                                                    className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
