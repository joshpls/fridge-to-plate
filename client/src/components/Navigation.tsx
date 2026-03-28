import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/userUtils';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { Menu, X } from 'lucide-react';

export const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [pantryCount, setPantryCount] = useState(0);
    const [shoppingCount, setShoppingCount] = useState(0);

    const fetchAllCounts = async () => {
        try {
            if (isAuthenticated && user?.id) {
                const pantryRes = await fetchWithAuth(`${API_BASE}/pantry?userId=${user.id}`);
                const pResult = await pantryRes.json();
                if (pResult.status === 'success') setPantryCount(pResult.data.length);
            } else {
                setPantryCount(0);
            }

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
    }, [location.pathname, isAuthenticated, user?.id]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-90 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                
                <div className="flex items-center">
                    <Link to="/" className="text-xl font-black text-orange-600 tracking-tighter hover:opacity-80 transition-opacity">
                        FRIDGE2PLATE
                    </Link>
                </div>

                <div className="hidden lg:flex items-center gap-6 xl:gap-8">
                    <Link to="/discovery" className={`text-sm font-bold transition-colors ${isActive('/discovery') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                        Discovery
                    </Link>
                    
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

                            {isAdmin && (
                                <Link to="/admin" className={`text-sm font-bold transition-colors ${isActive('/admin') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Admin
                                </Link>
                            )}
                        </>
                    )}

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200" />

                    {isAuthenticated ? (
                        <div className="flex items-center gap-5">
                            <Link to="/shopping-list" className="relative flex items-center gap-2 bg-gray-50 text-gray-900 px-3 py-2 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-100">
                                <span className="text-lg leading-none">🛒</span>
                                {shoppingCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {shoppingCount}
                                    </span>
                                )}
                            </Link>

                            <div className="flex flex-col items-end border-l pl-5 border-gray-100">
                                <Link to="/profile" className="text-xs font-black text-gray-900 leading-none hover:text-orange-600 transition-colors">
                                    {getDisplayName(user)}
                                </Link>
                                {isAdmin && (
                                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter mt-0.5">
                                        Admin
                                    </span>
                                )}
                            </div>
                            
                            <button onClick={handleLogout} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 transition-all">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/auth" className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-100">
                            Sign In
                        </Link>
                    )}
                </div>

                <div className="flex lg:hidden items-center gap-4">
                    {/* Quick Access Mobile Cart */}
                    {isAuthenticated && (
                        <Link to="/shopping-list" className="relative p-1">
                            <span className="text-xl">🛒</span>
                            {shoppingCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                    {shoppingCount}
                                </span>
                            )}
                        </Link>
                    )}
                    
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-gray-900 hover:text-orange-600 focus:outline-none p-1"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* MOBILE DROPDOWN MENU */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl flex flex-col px-6 py-4 z-40">
                    <div className="flex flex-col gap-4">
                        <Link to="/discovery" className={`text-base font-bold ${isActive('/discovery') ? 'text-orange-600' : 'text-gray-800'}`}>
                            Discovery
                        </Link>
                        
                        {isAuthenticated && (
                            <>
                                <Link to="/favorites" className={`text-base font-bold ${isActive('/favorites') ? 'text-orange-600' : 'text-gray-800'}`}>
                                    My Cookbook
                                </Link>
                                
                                <Link to="/pantry" className={`flex justify-between items-center text-base font-bold ${isActive('/pantry') ? 'text-orange-600' : 'text-gray-800'}`}>
                                    <span>Pantry</span>
                                    {pantryCount > 0 && (
                                        <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                                            {pantryCount} items
                                        </span>
                                    )}
                                </Link>
                                
                                <Link to="/recipe/add" className={`text-base font-bold ${isActive('/recipe/add') ? 'text-orange-600' : 'text-gray-800'}`}>
                                    Add Recipe
                                </Link>

                                <Link to="/shopping-list" className={`flex justify-between items-center text-base font-bold ${isActive('/shopping-list') ? 'text-orange-600' : 'text-gray-800'}`}>
                                    <span>Shopping List</span>
                                    {shoppingCount > 0 && (
                                        <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {shoppingCount} items
                                        </span>
                                    )}
                                </Link>

                                {isAdmin && (
                                    <Link to="/admin" className={`text-base font-bold ${isActive('/admin') ? 'text-orange-600' : 'text-gray-800'}`}>
                                        Admin Dashboard
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="h-px w-full bg-gray-100 my-5"></div>

                    {isAuthenticated ? (
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex flex-col">
                                <Link to="/profile" className="text-sm font-black text-gray-900 hover:text-orange-600">
                                    {getDisplayName(user)}
                                </Link>
                                <span className="text-xs text-gray-500">Manage Account</span>
                            </div>
                            <button onClick={handleLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition-colors">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/auth" className="block text-center bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-base shadow-md shadow-orange-100">
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};
