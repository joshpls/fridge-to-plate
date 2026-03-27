// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false }: { children?: React.ReactNode, adminOnly?: boolean }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) return null; // Or a loading spinner

    if (!isAuthenticated) {
        return <Navigate to="/auth" />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children ? <>{children}</> : <Outlet />;
};
