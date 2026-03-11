// src/components/Navigation.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation = () => {
    const location = useLocation();
    const [pantryCount, setPantryCount] = useState(0);
    const userId = '00000000-0000-0000-0000-000000000000';

    // Fetch pantry count to show "Stock Level"
    useEffect(() => {
        const getCount = async () => {
            const res = await fetch(`http://localhost:5000/api/pantry?userId=${userId}`);
            const result = await res.json();
            if (result.status === 'success') setPantryCount(result.data.length);
        };

        getCount();

        // Listen for the custom event
        window.addEventListener('pantryUpdated', getCount);
        return () => window.removeEventListener('pantryUpdated', getCount);
    }, [location.pathname]);

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
                        <Link to="/favorites" className={`text-sm font-bold transition-colors ${isActive('/favorites') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                            Favorites
                        </Link>
                        <Link to="/pantry" className={`relative text-sm font-bold transition-colors ${isActive('/pantry') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                            Pantry
                            {pantryCount > 0 && (
                                <span className="absolute -top-2 -right-4 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {pantryCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                <Link
                    to="/shopping-list"
                    className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-100 active:scale-95"
                >
                    <span className="text-lg">🛒</span>
                    <span className="text-sm">Shopping List</span>
                </Link>
            </div>
        </nav>
    );
};
