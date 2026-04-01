import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { IngredientsTab } from '../components/admin/IngredientsTab';
import { RecipesTab } from '../components/admin/RecipesTab';
import { UsersTab } from '../components/admin/UsersTab';
import { TagsUnitsTab } from '../components/admin/TagsUnitsTab';
import { CommentsTab } from '../components/admin/CommentsTab';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ users: 0, recipes: 0, ingredients: 0 });
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'recipes' | 'categories' | 'ingredients' | 'tags-units' | 'comments'>('overview');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/admin/stats`);
                const result = await res.json();
                if (result.status === 'success') setStats(result.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, [token]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'users', label: 'Users' },
        { id: 'recipes', label: 'Recipes' },
        { id: 'comments', label: 'Comments' },
        { id: 'categories', label: 'Categories' },
        { id: 'ingredients', label: 'Ingredients' },
        { id: 'tags-units', label: 'Tags, Units & Modifiers' }
    ];

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Admin <span className="text-orange-500">Dashboard</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">System Control & Management</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard label="Total Users" value={stats.users} color="bg-blue-50 text-blue-600 dark:bg-blue-500 dark:text-white" />
                <StatCard label="Total Recipes" value={stats.recipes} color="bg-orange-50 dark:bg-orange-500 text-orange-600 dark:text-white" />
                <StatCard label="Ingredients" value={stats.ingredients} color="bg-green-50 text-green-600 dark:bg-green-500 dark:text-white" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-8 border-b border-gray-100 dark:border-gray-800/50 mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-gray-900 dark:text-white border-b-2 border-orange-500' : 'text-gray-300 hover:text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Welcome, Admin</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">Select a tab above to manage your application data, monitor users, or update the recipe taxonomy.</p>
                    </div>
                )}

                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'recipes' && <RecipesTab />}
                {activeTab === 'comments' && <CommentsTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'ingredients' && <IngredientsTab />}
                {activeTab === 'tags-units' && <TagsUnitsTab />}
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
