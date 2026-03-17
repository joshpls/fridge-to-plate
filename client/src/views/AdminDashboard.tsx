import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { IngredientsTab } from '../components/admin/IngredientsTab';
import { RecipesTab } from '../components/admin/RecipesTab';
import { UsersTab } from '../components/admin/UsersTab';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ users: 0, recipes: 0, ingredients: 0 });
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'recipes' | 'categories' | 'ingredients'>('overview');
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const res = await fetch('http://localhost:5000/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.status === 'success') setStats(result.data);
        };
        fetchStats();
    }, [token]);

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            setLoadingUsers(true);
            fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(result => {
                    if (result.status === 'success') setUsers(result.data);
                })
                .finally(() => setLoadingUsers(false));
        }
    }, [activeTab, token, users.length]);

    const handleToggleRole = async (targetUserId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${targetUserId}/role`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await res.json();

            if (result.status === 'success') {
                // Instantly update the UI by mapping over our current state
                setUsers(prevUsers => 
                    prevUsers.map(u => 
                        u.id === targetUserId ? { ...u, role: result.data.role } : u
                    )
                );
            } else {
                toast.error(result.message); // E.g., "You cannot change your own role."
            }
        } catch (err) {
            console.error("Failed to toggle role", err);
            toast.error("A network error occurred.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Admin <span className="text-orange-500">Dashboard</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">System Control & Management</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard label="Total Users" value={stats.users} color="bg-blue-50 text-blue-600" />
                <StatCard label="Total Recipes" value={stats.recipes} color="bg-orange-50 text-orange-600" />
                <StatCard label="Ingredients" value={stats.ingredients} color="bg-green-50 text-green-600" />
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-100 mb-8">
                {['overview', 'users', 'recipes', 'categories', 'ingredients'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-300 hover:text-gray-500'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <main className="bg-gray-50 rounded-3xl p-8 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-black text-gray-900 mb-4">Welcome, Admin</h2>
                        <p className="text-gray-500 max-w-md mx-auto font-medium">Select a tab above to manage your application data, monitor users, or update the recipe taxonomy.</p>
                    </div>
                )}

                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'recipes' && <RecipesTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'ingredients' && <IngredientsTab />}
            </main>
        </div>
    );
};

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className={`p-8 rounded-3xl ${color}`}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
        <p className="text-4xl font-black">{value}</p>
    </div>
);

export default AdminDashboard;
