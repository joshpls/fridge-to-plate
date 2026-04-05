import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import type { AuthContextType, User } from '../models/Auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const updateUserParams = (newData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...newData } : null);
    };

    const switchHousehold = async (newHouseholdId: string) => {
        if (!user) return;
        
        try {
            // Optimistic UI update
            updateUserParams({ activeHouseholdId: newHouseholdId });
            
            // Sync with backend so the next API calls hit the right DB rows
            const response = await fetchWithAuth(`${API_BASE}/auth/profile`, {
                method: 'PATCH',
                body: JSON.stringify({ activeHouseholdId: newHouseholdId })
            });
            
            if (!response.ok) {
                throw new Error("Failed to switch household on the server.");
            }
            
            // Note: If you add React Query later, you would call queryClient.invalidateQueries() here 
            // to automatically refetch the pantry and recipes for the new household.
        } catch (error) {
            console.error(error);
            // Revert on failure
            if (user.activeHouseholdId) {
                updateUserParams({ activeHouseholdId: user.activeHouseholdId });
            }
        }
    };

    useEffect(() => {
        const handleForceLogout = () => {
            console.warn("Session fully expired. Forcing logout.");
            logout();
        };

        window.addEventListener('auth:forceLogout', handleForceLogout);
        
        return () => window.removeEventListener('auth:forceLogout', handleForceLogout);
    }, []);

    useEffect(() => {
        const verifySession = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetchWithAuth(`${API_BASE}/auth/me`);

                if (response.ok) {
                    const result = await response.json();
                    setUser(result.data); 
                } else if (response.status === 401) {
                    logout();
                }
            } catch (err) {
                console.error("Session verification failed", err);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [token]);

    useEffect(() => {
        let isDark = false;

        if (user?.preferences) {
            const prefs = typeof user.preferences === 'string' 
                ? JSON.parse(user.preferences) 
                : user.preferences;
            isDark = prefs.darkMode;
        } else {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [user]);

    const login = (userToken: string, userData: User) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            updateUserParams, 
            token, 
            login, 
            logout, 
            switchHousehold,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'ADMIN',
            loading 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
