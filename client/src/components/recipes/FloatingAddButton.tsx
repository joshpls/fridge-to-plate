import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingAddButton = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/recipe/add')}
            className="fixed bottom-10 right-10 z-50 group flex items-center gap-2 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl shadow-orange-200 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all duration-300"
            aria-label="Add New Recipe"
        >
            <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            
            {/* Optional: Text that expands on hover */}
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-black uppercase tracking-widest text-sm">
                Add Recipe
            </span>
        </button>
    );
};

export default FloatingAddButton;
