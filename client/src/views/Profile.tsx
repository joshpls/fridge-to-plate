// src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Shield, Moon, Flame, KeyRound } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

const Profile = () => {
    const { user, updateUserParams } = useAuth();
    
    // States for different sections
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPrefs, setLoadingPrefs] = useState(false);
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    // Form Data States
    const [profileData, setProfileData] = useState({ firstName: '', lastName: '', alias: '' });
    const [prefsData, setPrefsData] = useState({ darkMode: false, cookMode: true, ttsVoice: 'female' });
    const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Initialize from Context
    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                alias: user.alias || ''
            });
            
            if (user.preferences) {
                // Parse if it comes back as string, otherwise use directly
                const p = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
                setPrefsData({
                    darkMode: p.darkMode || false,
                    cookMode: p.cookMode ?? true,
                    ttsVoice: p.ttsVoice || 'female'
                });
            }
        }
    }, [user]);

    // --- Identity Submission ---
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const result = await res.json();
            if (result.status === 'success') {
                toast.success('Profile updated successfully!');
                updateUserParams(profileData); 
            } else throw new Error(result.message);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoadingProfile(false);
        }
    };

    // --- Preferences Submission ---
    const handlePrefsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingPrefs(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: prefsData })
            });
            const result = await res.json();
            if (result.status === 'success') {
                toast.success('Preferences saved!');
                updateUserParams({ preferences: prefsData }); 
            } else throw new Error(result.message);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update preferences');
        } finally {
            setLoadingPrefs(false);
        }
    };

    // --- Security Submission ---
    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            return toast.error("New passwords do not match!");
        }

        setLoadingSecurity(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    currentPassword: securityData.currentPassword, 
                    newPassword: securityData.newPassword 
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                toast.success('Password updated successfully!');
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else throw new Error(result.message);
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setLoadingSecurity(false);
        }
    };

    // Reusable Toggle Component
    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
        <button 
            type="button" 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${checked ? 'bg-orange-50 dark:bg-orange-500/150' : 'bg-gray-300'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
            <header className="mb-10 border-b border-gray-100 dark:border-gray-800/50 pb-8">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your identity, preferences, and security.</p>
            </header>

            <div className="space-y-8">
                
                {/* 1. IDENTITY CARD */}
                <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><User size={20} /></div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Public Profile</h2>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account Email</label>
                            <input type="text" disabled value={user?.email || ''} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800/50 rounded-xl text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                                <input type="text" value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-orange-500 outline-none transition-all font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                                <input type="text" value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-orange-500 outline-none transition-all font-medium" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Name (Alias)</label>
                            <input type="text" placeholder="Overrides your real name publicly" value={profileData.alias} onChange={e => setProfileData({...profileData, alias: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-orange-500 outline-none transition-all font-medium" />
                            <p className="text-xs text-gray-400 mt-2 font-medium">If set, this is what other users will see on your comments and authored recipes.</p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={loadingProfile} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 text-sm">
                                {loadingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 2. PREFERENCES CARD */}
                <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-xl"><Moon size={20} /></div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">App Preferences</h2>
                    </div>

                    <form onSubmit={handlePrefsSubmit} className="space-y-6">
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Moon size={16} className="text-gray-400"/> Dark Mode</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Easier on the eyes for late-night meal prep.</p>
                            </div>
                            <Toggle checked={prefsData.darkMode} onChange={(val) => setPrefsData({...prefsData, darkMode: val})} />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Flame size={16} className="text-orange-500"/> Cook Mode (Wake Lock)</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Automatically prevents your screen from sleeping while viewing a recipe.</p>
                            </div>
                            <Toggle checked={prefsData.cookMode} onChange={(val) => setPrefsData({...prefsData, cookMode: val})} />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Assistant Voice</h4>
                                <p className="text-sm text-gray-500 font-medium">Choose your preferred voice for Cook Mode.</p>
                            </div>
                            <select
                                value={prefsData.ttsVoice}
                                onChange={(e) => setPrefsData({ ...prefsData, ttsVoice: e.target.value })}
                                className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold outline-none focus:border-orange-500 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={loadingPrefs} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 text-sm">
                                {loadingPrefs ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 3. SECURITY CARD */}
                <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                        <div className="bg-green-50 text-green-600 p-2 rounded-xl"><KeyRound size={20} /></div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Security</h2>
                    </div>

                    <form onSubmit={handleSecuritySubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                            <input type="password" required value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-green-500 outline-none transition-all font-medium" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                                <input type="password" required minLength={6} value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-green-500 outline-none transition-all font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                                <input type="password" required minLength={6} value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-green-500 outline-none transition-all font-medium" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={loadingSecurity} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 text-sm">
                                {loadingSecurity ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </section>

            </div>
        </div>
    );
};

export default Profile;
