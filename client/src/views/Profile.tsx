import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Shield } from 'lucide-react';

const Profile = () => {
    const { user, token, updateUserParams } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        alias: ''
    });

    // Hydrate form with existing user data
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                alias: user.alias || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (result.status === 'success') {
                toast.success('Profile updated successfully!');
                // Instantly update global context
                updateUserParams(formData); 
            } else {
                toast.error(result.message || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 pb-24">
            <header className="mb-10 border-b border-gray-100 pb-8">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Profile Settings</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage how your identity appears across your cookbook.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
                
                {/* Email (Read Only) */}
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield size={14} /> Account Email
                    </label>
                    <input 
                        type="text" 
                        disabled 
                        value={user?.email || ''} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Joshua"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                        <input 
                            type="text" 
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <User size={14} /> Display Alias
                    </label>
                    <input 
                        type="text" 
                        placeholder="Overrides your real name on recipes and comments"
                        value={formData.alias}
                        onChange={(e) => setFormData({...formData, alias: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition-all font-medium"
                    />
                    <p className="text-xs text-gray-400 mt-2">If set, this is what other users will see. If left blank, your full name or email will be used.</p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
