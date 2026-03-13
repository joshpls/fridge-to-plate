import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RecipeModalProps {
    recipe: any;
    onClose: () => void;
}

export const RecipeModal = ({ recipe, onClose }: RecipeModalProps) => {
    const navigate = useNavigate();

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown); // unmount
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleOverlayClick}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header Image & Close */}
                <div className="relative h-64 bg-gray-200">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                        ✕
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-3xl font-bold">{recipe.name}</h2>
                        <div className="flex gap-2 mt-2">
                            {recipe.isVegan && <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded border border-green-500/30">Vegan</span>}
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">{recipe.matchPercentage}% Match</span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-8">
                        {/* Left: Ingredients Snapshot */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 border-b pb-1">Ingredients</h3>
                            <ul className="text-sm space-y-2">
                                {recipe.ingredients?.map((item: any) => (
                                    <li key={item.id} className="flex justify-between">
                                        <span className="text-gray-700">{item.ingredient.name}</span>
                                        <span className="text-gray-400 italic text-xs">{item.amount}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Quick Instructions */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 border-b pb-1">Quick Steps</h3>
                            <p className="text-sm text-gray-600 line-clamp-6 leading-relaxed">
                                {recipe.instructions || "No instructions provided."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Keep Browsing
                    </button>
                    <button
                        onClick={() => navigate(`/recipe/${recipe.slug}`)}
                        className="flex-1 px-4 py-3 bg-orange-500 text-white font-bold hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-200 transition-all"
                    >
                        Start Cooking
                    </button>
                </div>
            </div>
        </div>
    );
};
