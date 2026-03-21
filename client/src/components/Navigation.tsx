// src/components/Navigation.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/userUtils';
import { API_BASE } from '../utils/apiConfig';

export const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [pantryCount, setPantryCount] = useState(0);
    const [shoppingCount, setShoppingCount] = useState(0);
    
    // 1. Hook into the Auth Context
    const { user, isAuthenticated, isAdmin, logout, token } = useAuth();

    const fetchAllCounts = async () => {
        try {
            // 2. Only fetch pantry count from DB if a user is logged in
            if (isAuthenticated && user?.id) {
                const pantryRes = await fetch(`${API_BASE}/pantry?userId=${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const pResult = await pantryRes.json();
                if (pResult.status === 'success') setPantryCount(pResult.data.length);
            } else {
                setPantryCount(0);
            }

            // 3. Shopping List still comes from LocalStorage
            const localItems = storageService.shopping.get();
            setShoppingCount(localItems.length);

        } catch (err) {
            console.error("Failed to refresh counts", err);
        }
    };

    useEffect(() => {
        fetchAllCounts();

        window.addEventListener('pantryUpdated', fetchAllCounts);
        window.addEventListener('shoppingListUpdated', fetchAllCounts);

        return () => {
            window.removeEventListener('pantryUpdated', fetchAllCounts);
            window.removeEventListener('shoppingListUpdated', fetchAllCounts);
        };
    }, [location.pathname, isAuthenticated, user?.id]); // Re-run if auth status changes

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link to="/" className="text-xl font-black text-orange-600 tracking-tighter hover:opacity-80 transition-opacity">
                        FRIDGE2PLATE
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/discovery" className={`text-sm font-bold transition-colors ${isActive('/discovery') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                            Discovery
                        </Link>
                        
                        {/* 4. Only show personal links if authenticated */}
                        {isAuthenticated && (
                            <>
                                <Link to="/favorites" className={`text-sm font-bold transition-colors ${isActive('/favorites') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                                    My Cookbook
                                </Link>
                                <Link to="/pantry" className={`relative text-sm font-bold transition-colors ${isActive('/pantry') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Pantry
                                    {pantryCount > 0 && (
                                        <span className="absolute -top-2 -right-4 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {pantryCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to="/recipe/add" className={`text-sm font-bold transition-colors ${isActive('/recipe/add') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Add Recipe
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {isAuthenticated &&
                        <>
                            {isAdmin &&
                                <Link to="/admin" className={`text-sm font-bold transition-colors ${isActive('/admin') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Admin
                                </Link>
                            }
                            <Link
                                to="/shopping-list"
                                className="relative flex items-center gap-2 bg-gray-50 text-gray-900 px-4 py-2 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-100"
                            >
                                <span className="text-lg">🛒</span>
                                {shoppingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                        {shoppingCount}
                                    </span>
                                )}
                            </Link>
                        </>
                    }

                    {/* 5. Authentication UI Toggle */}
                    <div className="h-8 w-px bg-gray-100" />

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <Link to="/profile" className="text-xs font-black text-gray-900 leading-none hover:text-orange-600 transition-colors">
                                    {getDisplayName(user)}
                                </Link>
                                {isAdmin && (
                                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link 
                            to="/auth"
                            className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-100"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};
