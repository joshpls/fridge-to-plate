// src/components/admin/UsersTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Shield, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';

export const UsersTab = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                headers: { 
                    'Content-Type': 'application/json'
                },
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

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading users...</div>;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6">User Management</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-4">User</th>
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
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{u.lastName}, {u.firstName}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{u.alias}</p>
                                        </div>
                                    </div>
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
                                    <button 
                                        onClick={() => handleToggleRole(u.id, u.role)}
                                        className="text-[10px] font-black text-orange-500 hover:bg-orange-50 px-3 py-2 rounded-xl transition-all"
                                    >
                                        Toggle Role
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
