import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../utils/apiConfig';

// Define the shape of our User and the Context
interface User {
    id: string;
    firstName: string;
    lastName: string;
    alias: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    updateUserParams: (data: Partial<User>) => void;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const updateUserParams = (newData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...newData } : null);
    };

    useEffect(() => {
        const verifySession = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    setUser(result.data); // Set the real user data from DB
                } else {
                    // Token is invalid/expired
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
            isAuthenticated: !!user,
            isAdmin: user?.role === 'ADMIN',
            loading 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to make accessing auth state incredibly easy
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
