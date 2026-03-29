// src/components/recipes/RecipeModal.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDisplayName } from '../../utils/userUtils';
import { getNetworkImageUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

interface RecipeModalProps {
    recipe: any;
    onClose: () => void;
}

export const RecipeModal = ({ recipe, onClose }: RecipeModalProps) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown); 
    }, [onClose]);

    // Derived values
    const authorName = getDisplayName(recipe.author);
    const ratings = recipe.comments?.filter((c: any) => c.rating) || [];
    const avgRating = ratings.length > 0
        ? (ratings.reduce((sum: number, c: any) => sum + c.rating, 0) / ratings.length).toFixed(1)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleOverlayClick}>
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header Image & Close */}
                <div className="relative h-72 bg-gray-200">
                    <img
                        src={getNetworkImageUrl(recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1000&q=80')}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70 transition-colors z-10 flex items-center justify-center font-bold"
                    >
                        ✕
                    </button>
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 text-white right-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight mb-1">{recipe.name}</h2>
                                <p className="text-gray-300 font-medium text-sm flex items-center gap-3">
                                    <span>Created by {authorName}</span>
                                    {avgRating && <span className="text-yellow-400 font-bold">⭐ {avgRating} ({ratings.length})</span>}
                                </p>
                            </div>
                            {isAuthenticated && <div className="text-right">
                                <span className="bg-orange-500 text-white text-sm px-3 py-1.5 rounded-xl font-black shadow-lg block mb-2">
                                    {recipe.matchPercentage}% Match
                                </span>
                            </div>}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {recipe.category && (
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg border border-white/30 font-bold">
                                    {recipe.category.name}
                                </span>
                            )}
                            {recipe.tags?.map((tag: any) => (
                                <span key={tag.id} className="bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 font-bold uppercase tracking-widest">
                                    {tag.code} {tag.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Ingredients Snapshot */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-black text-gray-900 mb-4 text-lg border-b pb-2 flex justify-between">
                                <span>Ingredients</span>
                                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{recipe.ingredients?.length || 0} items</span>
                            </h3>
                            <ul className="space-y-3">
                                {recipe.ingredients?.map((item: any) => (
                                    <li key={item.id} className="flex justify-between items-center pb-2">
                                        <div className="flex items-center gap-2">
                                            {/* Green checkmark if in pantry, Red dot if missing */}
                                            {isAuthenticated && <span className={`w-2 h-2 rounded-full ${item.inPantry || item.isStaple ? 'bg-green-500' : 'bg-red-400'}`}></span>}
                                            <span className={`font-medium ${item.inPantry || item.isStaple ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {item.name}
                                                {item.modifier && <span className="text-gray-400 font-normal">, {item.modifier.toLowerCase()}</span>}
                                            </span>
                                        </div>
                                        <span className="text-gray-400 font-bold text-xs uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">
                                            {item.amount} {item.unit?.abbreviation || ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Quick Instructions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-black text-gray-900 mb-4 text-lg border-b pb-2 flex justify-between">
                                <span>Quick Summary</span>
                                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                                    ⏱️ {recipe.totalTime || recipe.prepTime || 0} mins
                                </span>
                            </h3>
                            
                            {recipe.summary && (
                                <p className="text-sm text-gray-600 italic mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    "{recipe.summary}"
                                </p>
                            )}

                            <div className="text-sm text-gray-700 line-clamp-10 leading-relaxed whitespace-pre-wrap">
                                {recipe.instructions || "No instructions provided."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3.5 text-gray-500 font-bold border-2 border-gray-500 hover:bg-gray-100 rounded-2xl transition-colors tracking-widest uppercase text-sm"
                    >
                        Keep Browsing
                    </button>
                    <button
                        onClick={() => navigate(`/recipe/${recipe.slug}`)}
                        className="flex-2 px-4 py-3.5 bg-orange-600 text-white font-black hover:bg-orange-700 rounded-2xl shadow-xl shadow-orange-200 transition-all tracking-widest uppercase text-sm transform hover:-translate-y-0.5"
                    >
                        View Full Recipe & Cook
                    </button>
                </div>
            </div>
        </div>
    );
};
