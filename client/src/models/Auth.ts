export interface User {
    id: string;
    firstName: string;
    lastName: string;
    alias: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

export interface AuthContextType {
    user: User | null;
    updateUserParams: (data: Partial<User>) => void;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}
