import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDisplayName } from '../../utils/userUtils';
import { API_BASE, getNetworkImageUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../utils/apiClient';
import toast from 'react-hot-toast';
import { Heart, X } from 'lucide-react';
import { formatDecimalToQuantity } from '../../utils/recipeUtils';

interface RecipeModalProps {
    recipe: any;
    showStaples: boolean;
    onClose: () => void;
}

export const RecipeModal = ({ recipe, showStaples, onClose }: RecipeModalProps) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isFavorite, setIsFavorite] = useState(recipe.isFavorite);

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

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            toast.error("You must be signed in to favorite a recipe.");
            return;
        }
        
        try {
            const response = await fetchWithAuth(`${API_BASE}/recipes/${recipe.slug}/favorite`, {
                method: 'POST',
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                setIsFavorite(result.data.favorited);
            } else {
                toast.error(result.message || 'Failed to update favorite status.');
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error('An error occurred.');
        }
    };

    // Derived values
    const authorName = getDisplayName(recipe.author);
    const ratings = recipe.comments?.filter((c: any) => c.rating) || [];
    const avgRating = ratings.length > 0
        ? (ratings.reduce((sum: number, c: any) => sum + c.rating, 0) / ratings.length).toFixed(1)
        : null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleOverlayClick}>
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header Image & Close */}
                <div className="relative h-48 sm:h-72 bg-gray-200 shrink-0">
                    <img
                        src={getNetworkImageUrl(recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1000&q=80')}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70 transition-colors z-10 flex items-center justify-center font-bold"
                    >
                        ✕
                    </button>

                    {isAuthenticated && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
                        <button
                            onClick={handleToggleFavorite}
                            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center font-bold ${isFavorite ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-black/50 text-white hover:bg-black/70'}`}
                        >
                            <Heart size={18} className={isFavorite ? 'fill-white' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70 transition-colors flex items-center justify-center font-bold"
                        >
                            <X size={18} />
                        </button>
                    </div>}

                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
                        <div className="flex justify-between items-end gap-2">
                            <div className="min-w-0">
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-1 truncate">{recipe.name}</h2>
                                <p className="text-gray-300 font-medium text-xs sm:text-sm flex items-center gap-2 sm:gap-3 truncate">
                                    <span>By {authorName}</span>
                                    {avgRating && <span className="text-yellow-400 font-bold shrink-0">⭐ {avgRating} ({ratings.length})</span>}
                                </p>
                            </div>
                            {isAuthenticated && (
                                <div className="text-right shrink-0">
                                    <span className="bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl font-black shadow-lg block mb-1 sm:mb-2 whitespace-nowrap">
                                        {recipe.matchPercentage}% Match
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 flex-wrap">
                            {recipe.category && (
                                <span className="bg-white dark:bg-gray-900/20 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-white/30 font-bold">
                                    {recipe.category.name}
                                </span>
                            )}
                            {recipe.tags?.map((tag: any) => (
                                <span key={tag.id} className="bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-white/20 font-bold uppercase tracking-widest">
                                    {/* Mobile: Code only | Desktop: Name only */}
                                    <span className="sm:hidden">{tag.code}</span>
                                    <span className="hidden sm:inline">{tag.name}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-800 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        
                        {/* Left: Ingredients Snapshot */}
                        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/50">
                            <h3 className="font-black text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg border-b pb-2 flex justify-between items-center">
                                <span>Ingredients</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{recipe.ingredients?.length || 0} items</span>
                            </h3>
                            <ul className="space-y-2.5 sm:space-y-3">
                                {recipe.ingredients?.map((item: any) => (
                                    <li key={item.id} className="flex justify-between items-start sm:items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="flex items-start sm:items-center gap-2 pr-2">
                                            {/* Green checkmark if in pantry, Red dot if missing */}
                                            {isAuthenticated && (
                                                <span className={`w-2 h-2 rounded-full mt-1.5 sm:mt-0 shrink-0 ${item.inPantry || (!showStaples && item.isStaple) ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                            )}
                                            <span className={`font-medium text-sm sm:text-base leading-snug ${item.inPantry || (!showStaples && item.isStaple) ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {item.name}
                                                {item.modifier && <span className="text-gray-400 font-normal">, {item.modifier.toLowerCase()}</span>}
                                            </span>
                                        </div>
                                        <span className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md shrink-0 mt-0.5 sm:mt-0">
                                            {formatDecimalToQuantity(item.amount)} {item.unit?.abbreviation || ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Quick Instructions */}
                        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/50 h-fit">
                            <h3 className="font-black text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg border-b pb-2 flex justify-between items-center">
                                <span>Quick Summary</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                                    ⏱️ {recipe.totalTime || recipe.prepTime || 0} mins
                                </span>
                            </h3>
                            
                            {recipe.summary && (
                                <p className="text-xs sm:text-sm text-gray-600 italic mb-4 p-3 bg-orange-50 dark:bg-orange-500/15 rounded-xl border border-orange-100 leading-relaxed">
                                    "{recipe.summary}"
                                </p>
                            )}

                            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-6 sm:line-clamp-10 leading-relaxed whitespace-pre-wrap">
                                {recipe.instructions || "No instructions provided."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 sm:p-6 bg-white dark:bg-gray-900 border-t flex flex-row gap-2 sm:gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-2 py-2.5 sm:px-4 sm:py-3.5 text-gray-500 dark:text-gray-400 font-bold border-2 border-gray-400 sm:border-gray-500 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-colors tracking-widest uppercase text-[10px] sm:text-sm"
                    >
                        <span className="sm:hidden">Close</span>
                        <span className="hidden sm:inline">Keep Browsing</span>
                    </button>
                    <button
                        onClick={() => navigate(`/recipe/${recipe.slug}`)}
                        className="flex-2 px-2 py-2.5 sm:px-4 sm:py-3.5 bg-orange-600 dark:bg-orange-500 text-white font-black hover:bg-orange-700 dark:hover:bg-orange-600 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl shadow-orange-200 dark:border-gray-800 dark:shadow-none transition-all tracking-widest uppercase text-[10px] sm:text-sm transform sm:hover:-translate-y-0.5"
                    >
                        <span className="sm:hidden">View Recipe</span>
                        <span className="hidden sm:inline">View Full Recipe & Cook</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
