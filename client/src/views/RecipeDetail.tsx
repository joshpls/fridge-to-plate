// src/pages/RecipeDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { addIngredientsToShoppingList } from '../utils/shoppingUtils';
import { CompactNutritionDisplay } from '../components/recipes/CompactNutrition';
import { CookMode } from '../components/recipes/CookMode';
import { ShareButton } from '../components/ui/ShareButton';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/userUtils';
import { Printer, Play, Heart, Check } from 'lucide-react'; // Added Check icon
import { convertUnit } from '../utils/helperFunctions';
import toast from 'react-hot-toast';
import { API_BASE, getNetworkImageUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';
import { useConfirm } from '../context/ConfirmContext';
// import { useWakeLock } from '../hooks/useWakeLock';
import { SourceAttribution } from '../components/recipes/RenderSourceAttribution';
import { taxonomyService } from '../services/taxonomyService';
import { pantryService } from '../services/pantryService';
import { storageService } from '../services/storageService';
import { refreshPantryCount } from '../utils/events';

const RecipeDetail = () => {
    const { confirm } = useConfirm();
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
    
    // Auth & User Context
    const { user, isAdmin, isAuthenticated } = useAuth();
    const userId = user?.id;
    // const prefs = user?.preferences
    //     ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences)
    //     : { cookMode: true, autoTTS: false };

    // const { isLocked } = useWakeLock(prefs.cookMode);

    // Sidebar Controls State
    const [multiplier, setMultiplier] = useState(1);
    const [showStaples, setShowStaples] = useState(false);
    const [allowSubstitutions, setAllowSubstitutions] = useState(true);
    const [missingIngredients, setMissingIngredients] = useState<any[]>([]);

    // Comment State
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState<number>(5);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [measurementSystem, setMeasurementSystem] = useState<'original' | 'metric' | 'imperial'>('original');

    // Background Data for Smart Swaps
    const [pantryItems, setPantryItems] = useState<any[]>([]);
    const [taxonomyIngredients, setTaxonomyIngredients] = useState<any[]>([]);

    // Swap Modal State
    const [activeSwaps, setActiveSwaps] = useState<Record<string, any>>({});
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapTarget, setSwapTarget] = useState<any>(null);
    const [swapOptions, setSwapOptions] = useState<any[]>([]);

    const [isCookModeOpen, setIsCookModeOpen] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                if (!slug) return;
                
                const cached = storageService.cache.getRecipe(slug, userId);
                if (cached) {
                    setRecipe(cached);
                    setLoading(false);
                    return;
                }

                const [recipeRes] = await Promise.all([
                    fetchWithAuth(`${API_BASE}/recipes/${slug}?userId=${userId || ''}`)
                ]);

                const recipeResult = await recipeRes.json();

                if (recipeResult.status === 'success') {
                    storageService.cache.setRecipe(slug, recipeResult.data, userId);
                    setRecipe(recipeResult.data);
                    setCheckedIngredients(new Set());
                }
            } catch (error) {
                console.error("Failed to load recipe detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug, userId]);

    // Derived Values
    const authorName = recipe?.author ? getDisplayName(recipe.author) : "@chef";
    const ratings = recipe?.comments?.filter((c: any) => c.rating) || [];
    const avgRating = ratings.length > 0
        ? (ratings.reduce((sum: number, c: any) => sum + c.rating, 0) / ratings.length).toFixed(1)
        : null;

    const formatIngredientAmount = (baseAmount: number, baseUnitName: string) => {
        const scaled = baseAmount * multiplier;

        if (measurementSystem === 'original' || !baseUnitName) {
            const finalNum = Number.isInteger(scaled) ? scaled : parseFloat(scaled.toFixed(2));
            return { amount: finalNum, unit: baseUnitName || '' };
        }

        const converted = convertUnit(scaled, baseUnitName, measurementSystem);

        if (converted.amount === scaled) {
            const finalNum = Number.isInteger(scaled) ? scaled : parseFloat(scaled.toFixed(2));
            return { amount: finalNum, unit: converted.unit };
        }

        let finalAmountStr = converted.amount.toFixed(1);
        if (finalAmountStr.endsWith('.0')) {
            finalAmountStr = finalAmountStr.slice(0, -2);
        }

        return { amount: finalAmountStr, unit: converted.unit };
    };

    const addToShoppingList = async () => {
        const itemsToAdd = missingIngredients.map((item: any) => {
            const { amount, unit } = formatIngredientAmount(item.amount, item.unit?.name || '');
            return {
                ingredientId: item.ingredientId,
                name: item.name,
                quantity: `${amount}`.trim(),
                unit: `${unit}`.trim(),
                unitId: item.unit?.id || null
            };
        });
        await addIngredientsToShoppingList(itemsToAdd);
    };

    useEffect(() => {
        if (recipe && isAuthenticated) {
            const ingredients = recipe.ingredients.filter((item: any) => {
                if (item.inPantry) return false; 
                if (allowSubstitutions && item.isSubstituted) return false; 
                if (!showStaples && item.isStaple) return false;
                return true;
            });
            setMissingIngredients(ingredients);
        }
    }, [recipe, showStaples, allowSubstitutions, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            pantryService.getPantry().then((res: any) => {
                if (res) {
                    const itemsArray = Array.isArray(res) ? res : res.items || [];
                    setPantryItems(itemsArray);
                }
            });
            taxonomyService.getTaxonomy().then(res => {
                if (res && res.ingredients) setTaxonomyIngredients(res.ingredients);
            });
        }
    }, [isAuthenticated]);


    // Handlers
    const handleSwap = (originalIngredientId: string, substitute: any) => {
        setActiveSwaps(prev => ({ ...prev, [originalIngredientId]: substitute }));
    };

    const handleUndoSwap = (originalIngredientId: string) => {
        setActiveSwaps(prev => {
            const newSwaps = { ...prev };
            delete newSwaps[originalIngredientId];
            return newSwaps;
        });
    };

    const executeSwap = (ing: any) => {
        if (!ing.subGroupId) {
            toast.error("No substitution group found for this item.");
            return;
        }

        const groupIngredients = taxonomyIngredients.filter(t => 
            t.subGroupId === ing.subGroupId && t.id !== ing.ingredientId
        );

        const availableSubs = groupIngredients.filter(gIng =>
            pantryItems.some(pItem => pItem.ingredientId === gIng.id)
        );

        if (availableSubs.length === 0) {
            toast.error("No valid substitutes found in your pantry.");
            return;
        }

        if (availableSubs.length === 1) {
            handleSwap(ing.id, { name: availableSubs[0].name, ingredientId: availableSubs[0].id });
            toast.success(`Automatically swapped for ${availableSubs[0].name}`);
        } else {
            setSwapTarget(ing);
            setSwapOptions(availableSubs);
            setSwapModalOpen(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDeleteRecipe = async () => {
        const isConfirmed = await confirm({
            title: "Delete this recipe?",
            message: "Are you sure you want to delete this recipe entirely?",
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;

        try {
            await fetchWithAuth(`${API_BASE}/recipes/${recipe.id}`, {
                method: 'DELETE'
            });
            navigate('/discovery');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !isAuthenticated) {
            toast.error("You must be signed in to leave a review.");
            return;
        }
        setIsSubmittingComment(true);

        try {
            const res = await fetchWithAuth(`${API_BASE}/recipes/${recipe.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ content: newComment, rating: newRating, userId })
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                setRecipe({
                    ...recipe,
                    comments: [result.data, ...recipe.comments]
                });
                toast.success("Review posted!");
                setNewComment('');
                setNewRating(5);
            }
        } catch (err) {
            console.error("Failed to post comment", err);
            toast.error("Network error. Please try again.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const isConfirmed = await confirm({
            title: "Delete this review?",
            message: `Are you sure you want to delete this review?`,
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;

        try {
            const response = await fetchWithAuth(`${API_BASE}/recipes/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Review deleted successfully');
                
                setRecipe((prevRecipe: any) => ({
                    ...prevRecipe,
                    comments: prevRecipe.comments.filter((c: any) => c.id !== commentId)
                }));
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete review');
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error('An error occurred while deleting your review');
        }
    };

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
                setRecipe({ ...recipe, isFavorite: result.data.favorited });
            } else {
                toast.error(result.message || 'Failed to update favorite status.');
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error('An error occurred.');
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold text-xl print:hidden">Prepping your kitchen...</div>;
    if (!recipe) return <div className="p-20 text-center text-red-500 font-bold">Recipe not found.</div>;

    const steps = recipe.instructions?.split('\n').filter((s: string) => s.trim() !== '') || [];

    const effectiveIngredients = recipe?.ingredients?.map((ing: any) => {
        const activeSwap = activeSwaps[ing.id];
        if (activeSwap) {
            return {
                ...ing,
                originalName: ing.name,
                name: activeSwap.name,
                ingredientId: activeSwap.ingredientId || activeSwap.id,
                isSwapped: true,
                inPantry: true,
            };
        }
        return ing;
    }) || [];

    // Complete Recipe Logic
    const usedPantryIngredients = effectiveIngredients.filter((ing: any) => ing.inPantry);
    const canComplete = usedPantryIngredients.length > 0;

    const handleCompleteRecipe = async () => {
        const usedIngredientIds = usedPantryIngredients.map((ing: any) => ing.ingredientId);
        
        if (usedIngredientIds.length === 0) return;

        const isConfirmed = await confirm({
            title: "Complete Recipe?",
            message: `This will remove ${usedIngredientIds.length} used ingredient(s) from your pantry. Are you sure?`,
            confirmText: "Yes, complete it"
        });

        if (!isConfirmed) return;

        try {
            const response = await fetchWithAuth(`${API_BASE}/pantry/bulk-remove`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredientIds: usedIngredientIds })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                toast.success("Recipe completed! Pantry updated.");
                
                // Update local pantry state to reflect removal
                const updatedPantry = pantryItems.filter(p => !usedIngredientIds.includes(p.ingredientId));
                setPantryItems(updatedPantry);
                
                // Update the recipe state to turn the inPantry dots back to orange
                setRecipe((prev: any) => ({
                    ...prev,
                    ingredients: prev.ingredients.map((ing: any) => ({
                        ...ing,
                        inPantry: usedIngredientIds.includes(ing.ingredientId) ? false : ing.inPantry
                    }))
                }));
                
                // Clear active swaps
                const newSwaps = { ...activeSwaps };
                let swapsChanged = false;
                for (const key in newSwaps) {
                    if (usedIngredientIds.includes(newSwaps[key].ingredientId)) {
                        delete newSwaps[key];
                        swapsChanged = true;
                    }
                }
                if (swapsChanged) setActiveSwaps(newSwaps);
                
                // Sync cache and invalidate discovery 
                storageService.cache.setPantry(updatedPantry);
                refreshPantryCount();
            } else {
                toast.error(result.message || "Failed to update pantry");
            }
        } catch (err) {
            console.error("Failed to complete recipe:", err);
            toast.error("An error occurred while updating the pantry.");
        }
    };

    // Pre-format ingredients for Cook Mode
    const formattedIngredients = effectiveIngredients.map((item: any) => {
        const { amount, unit } = formatIngredientAmount(item.amount, item.unit?.name || '');
        return {
            id: item.id,
            name: item.name,
            modifier: item.modifier,
            displayAmount: `${amount} ${unit}`.trim()
        };
    });

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24 print:p-0 print:m-0 print:text-black print:bg-white">
            <nav className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-200 mb-6 uppercase tracking-wider print:hidden">
                <Link to="/discovery" className="hover:text-orange-600 transition-colors">Discovery</Link>
                <span>/</span>
                {recipe.category && <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">{recipe.category.name}</span>}
                {recipe.subcategory && <><span>/</span><span className="text-orange-600 truncate max-w-[100px] sm:max-w-none">{recipe.subcategory.name}</span></>}
            </nav>

            <div className="hidden print:flex justify-between items-center pb-4 mb-8 border-b-2 border-black">
                <h1 className="text-xl font-bold">FRIDGE TO PLATE • Chef's Sheet</h1>
                <p className="text-sm font-medium text-gray-600">
                    Printed on: {new Date().toLocaleDateString()}
                </p>
            </div>

            <div className="w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden mb-8 relative shadow-sm print:h-64 print:rounded-none print:shadow-none print:border-b-2 print:border-gray-200">
                <img src={getNetworkImageUrl(recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&q=80')} alt={recipe.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent print:hidden" />
                
                <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden z-10">
                    {(isAdmin || (isAuthenticated && user?.id === recipe?.author?.id)) && (
                        <div className="flex gap-2 mr-1">
                            <Link to={`/edit-recipe/${recipe.slug}`}>
                                <button title="Edit Recipe" className="bg-white dark:bg-gray-900/90 backdrop-blur text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl font-black text-sm hover:bg-white dark:hover:bg-orange-500 transition-all shadow-lg">
                                    ✏️ Edit
                                </button>
                            </Link>
                            <button onClick={handleDeleteRecipe} title="Delete Recipe" className="bg-red-500/90 backdrop-blur text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-red-600 transition-all shadow-lg">
                                🗑️ Delete
                            </button>
                        </div>
                    )}
                    {isAuthenticated &&
                        <button
                            onClick={handleToggleFavorite}
                            title={recipe?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center font-bold ${recipe?.isFavorite ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-black/50 text-white hover:bg-black/70'}`}
                        >
                            <Heart size={20} className={recipe?.isFavorite ? 'fill-white' : ''} />
                        </button>
                    }
                </div>
            </div>

            {/* Main Header Info */}
            <header className="mb-10 text-center md:text-left print:text-left print:mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-6">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight print:text-4xl print:tracking-tight print:leading-none print:font-black print:text-black">
                        {recipe.name}
                    </h1>

                    {/* {isLocked && (
                            <div className="hidden md:flex items-center gap-1.5 text-orange-500 bg-orange-50 dark:bg-orange-500/15 px-3 py-2 rounded-xl border border-orange-100 mr-2" title="Cook Mode Active: Screen will stay on">
                                <Flame size={16} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Cook Mode</span>
                            </div>
                        )} */}

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 print:hidden items-center flex-wrap justify-center md:justify-start">
                        <button
                            onClick={() => setIsCookModeOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-orange-600 dark:bg-orange-500 text-white rounded-xl font-black text-sm md:text-base hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/30 active:scale-95 shrink-0"
                        >
                            <Play size={18} className="fill-current" /> Start Cooking
                        </button>

                        {isAuthenticated && canComplete && (
                            <button
                                onClick={handleCompleteRecipe}
                                title="Complete and use up pantry ingredients"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-green-600 dark:bg-green-500 text-white rounded-xl font-black text-sm md:text-base hover:bg-green-700 transition-all shadow-lg shadow-green-500/30 active:scale-95 shrink-0"
                            >
                                <Check size={18} className="stroke-[3]" /> Finish Recipe
                            </button>
                        )}

                        <div className="w-full sm:w-auto">
                            <ShareButton
                                title={recipe.name}
                                text={
                                    `Check out this ${recipe.name} recipe on Fridge To Plate!\n\n` +
                                    `⏱️ Total Time: ${recipe.totalTime ? recipe.totalTime + 'm' : 'N/A'}\n` +
                                    `🏷️ Tags: ${recipe.tags?.map((t: any) => t.name).join(', ') || 'None'}\n\n` +
                                    `${recipe.summary ? recipe.summary : ''}`
                                }
                            />
                        </div>

                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-orange-500/10 text-gray-800 dark:text-orange-400 border-2 border-gray-200 dark:border-orange-500/20 dark:hover:text-orange-500 rounded-xl font-bold text-sm hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm active:scale-95 shrink-0 w-full sm:w-auto"
                        >
                            <Printer size={18} /> Print Sheet
                        </button>
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 text-sm font-bold text-gray-500 dark:text-gray-400 mb-6 print:text-gray-700 print:justify-start px-4 md:px-0">
                    <span className="flex items-center gap-1.5">
                        👨‍🍳 By <span className="text-gray-900 dark:text-gray-200 print:text-black">{authorName}</span>
                    </span>

                    {(recipe.sourceName || recipe.sourceUrl) && (
                        <>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                            <SourceAttribution
                                sourceName={recipe.sourceName}
                                sourceUrl={recipe.sourceUrl}
                            />
                        </>
                    )}

                    {avgRating && (
                        <>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-yellow-500 dark:text-yellow-400 flex items-center gap-1 text-base print:text-black">
                                ★ <span className="font-bold">{avgRating}</span>
                                <span className="text-gray-400 dark:text-gray-200 text-sm print:text-gray-600">
                                    ({ratings.length} reviews)
                                </span>
                            </span>
                        </>
                    )}
                </div>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-200 mb-6 font-medium leading-relaxed max-w-3xl mx-auto md:mx-0 print:max-w-full print:text-black print:text-base print:leading-relaxed print:italic px-4 md:px-0">
                    {recipe.summary || "A delicious recipe ready to be cooked."}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 items-center print:justify-start px-4 md:px-0">
                    {recipe && (
                        <span className="bg-orange-500 dark:bg-orange-400 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md print:bg-white print:text-black print:border print:border-black print:shadow-none print:px-3 print:py-1">
                            {recipe?.matchPercentage}% Match
                        </span>
                    )}
                    {recipe.tags?.map((tag: any) => (
                        <span key={tag.id} className="bg-gray-100 text-gray-600 dark:text-gray-200 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
                            {tag.name}
                        </span>
                    ))}
                </div>
            </header>

            {/* Metadata Hero Bar*/}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-3xl p-4 sm:p-6 print:bg-transparent print:border-gray-200 print:rounded-none print:grid-cols-4 print:p-4 print:mb-6">
                <div className="flex flex-col items-center md:items-start text-center md:text-left print:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 dark:text-orange-400/70 mb-1 print:text-gray-600">Prep Time</span>
                    <span className="text-xl md:text-2xl font-black text-orange-900 dark:text-orange-400 print:text-black print:text-xl">{recipe.prepTime ? `${recipe.prepTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left print:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 dark:text-orange-400/70 mb-1 print:text-gray-600">Cook Time</span>
                    <span className="text-xl md:text-2xl font-black text-orange-900 dark:text-orange-400 print:text-black print:text-xl">{recipe.cookTime ? `${recipe.cookTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left print:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 dark:text-orange-400/70 mb-1 print:text-gray-600">Total Time</span>
                    <span className="text-xl md:text-2xl font-black text-orange-900 dark:text-orange-400 print:text-black print:text-xl">{recipe.totalTime ? `${recipe.totalTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left print:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 dark:text-orange-400/70 mb-1 print:text-gray-600">Yields</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-orange-900 dark:text-orange-400 print:text-black print:text-xl leading-tight">
                        {recipe.servings ? `${recipe.servings * multiplier} servings` : '--'}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8 md:gap-12 print:grid-cols-1 print:gap-8">
                
                {/* Left Sidebar: Ingredients & Nutrition */}
                <aside className="lg:col-span-1 space-y-10 print:space-y-6">
                    <section>
                        <div className="flex flex-col gap-4 mb-6 print:mb-3">
                            <h2 className="text-2xl font-black flex items-center gap-2 print:text-xl">
                                Ingredients <span className="text-sm font-medium text-gray-400 bg-gray-100 dark:text-gray-400 dark:bg-gray-800 px-3 py-1 rounded-full print:border print:border-gray-200 print:text-black print:bg-white ">{recipe.ingredients?.length} Items</span>
                            </h2>
                            
                            {/* Multiplier & Toggle Staples */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col gap-3 print:hidden">
                                <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                                    {[1, 2, 3].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setMultiplier(val)}
                                            className={`flex-1 py-1.5 rounded-lg text-sm font-black transition-all ${multiplier === val
                                                ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {val}x
                                        </button>
                                    ))}
                                </div>
                                {isAuthenticated && 
                                    <button
                                        onClick={() => setShowStaples(!showStaples)}
                                        className={`w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${showStaples
                                                ? 'bg-gray-800 text-white dark:bg-gray-700 dark:text-white shadow-md'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                                            }`}
                                    >
                                        {showStaples ? 'Showing All Staples' : 'Hiding Common Staples'}
                                    </button>
                                }
                                {isAuthenticated &&
                                    <button
                                        onClick={() => setAllowSubstitutions(!allowSubstitutions)}
                                        className={`w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${allowSubstitutions
                                                ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 shadow-sm'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                                            }`}
                                    >
                                        {allowSubstitutions ? '💡 Smart Subs: ON' : '🚫 Smart Subs: OFF'}
                                    </button>
                                }
                                <button
                                    onClick={() => {
                                        setMeasurementSystem(prev => {
                                            if (prev === 'original') return 'metric';
                                            if (prev === 'metric') return 'imperial';
                                            return 'original';
                                        });
                                    }}
                                    className="w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-all bg-white dark:bg-gray-900 text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm flex items-center justify-between"
                                >
                                    <span>Units:</span>
                                    <span className="uppercase tracking-widest bg-blue-100 px-2 py-1 rounded-md text-[10px] text-blue-800">
                                        {measurementSystem === 'original' ? 'Original' : measurementSystem === 'metric' ? 'Metric (g, ml)' : 'US Customary (oz, cup)'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Missing Ingredients Alert*/}
                        {missingIngredients.length > 0 && (
                            <div className="mb-4 bg-orange-50 dark:bg-orange-500/15 border border-orange-100 p-4 rounded-2xl shadow-sm print:hidden">
                                <p className="text-orange-800 font-bold text-sm mb-3">You're missing {missingIngredients.length} items.</p>
                                <button 
                                    onClick={addToShoppingList} 
                                    className="w-full bg-orange-50 dark:bg-orange-500/150 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                                >
                                    🛒 Add Missing to Cart
                                </button>
                            </div>
                        )}

                        <ul className="space-y-3 print:space-y-1">
                            {effectiveIngredients.map((item: any) => {
                                const { amount, unit } = formatIngredientAmount(item.amount, item.unit?.name || '');
                                return (
                                    <li key={item.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm print:rounded-none print:shadow-none print:border-0 print:border-b print:border-gray-200 print:p-1.5">
                                        
                                        <div className="flex items-center gap-3 w-full pr-2">
                                            {isAuthenticated && <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.inPantry ? 'bg-green-500' : (allowSubstitutions && item.isSubstituted) ? 'bg-blue-500' : 'bg-orange-300'} print:border print:border-black print:w-3 print:h-3 print:rounded-sm print:bg-white`} />}
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-bold text-sm print:text-black print:text-sm truncate sm:whitespace-normal ${item.isSwapped ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'}`}>
                                                    {item.name}
                                                    {item.modifier && (
                                                        <span className="text-gray-500 dark:text-gray-400 font-medium">, {item.modifier.toLowerCase()}</span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 print:text-gray-600 print:font-medium">
                                                    {amount} {unit}
                                                </p>
                                                {/* Show original ingredient if swapped */}
                                                {item.isSwapped && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-through mt-0.5 print:hidden">
                                                        Originally: {item.originalName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0 print:hidden">
                                            {/* Swap Actions */}
                                            {item.isSwapped ? (
                                                <button 
                                                    onClick={() => handleUndoSwap(item.id)}
                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                                >
                                                    Undo Swap
                                                </button>
                                            ) : (isAuthenticated && allowSubstitutions && item.isSubstituted && !item.inPantry) ? (
                                                <button 
                                                    onClick={async () => executeSwap(item)}
                                                    className="text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors"
                                                >
                                                    Swap
                                                </button>
                                            ) : null}

                                            {/* Status Badge */}
                                            {isAuthenticated &&
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.inPantry ? 'text-green-600 bg-green-50' :
                                                        (allowSubstitutions && item.isSubstituted) ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'text-orange-500 bg-orange-50 dark:bg-orange-500/15'}`}>
                                                    {item.inPantry ? 'In Pantry' : (allowSubstitutions && item.isSubstituted) ? 'Sub Available' : 'Missing'}
                                                </span>
                                            }
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>

                    <CompactNutritionDisplay nutrition={recipe.nutrition} />
                </aside>

                {/* Right Content: Instructions, Notes & Comments */}
                <main className="lg:col-span-2 space-y-12 print:space-y-6">
                    <section>
                        <h2 className="text-2xl font-black mb-6 print:text-xl print:mb-3">Instructions</h2>
                        <div className="space-y-4 print:space-y-2">
                            {steps.map((step: string, index: number) => (
                                <div key={index}
                                    onClick={() => setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index])}
                                    className={`group p-4 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer flex gap-4 sm:gap-5 print:rounded-none print:shadow-none print:p-2 print:gap-3 print:bg-transparent print:border-0 print:border-b print:border-gray-200 dark:border-gray-800 ${completedSteps.includes(index)
                                            ? 'bg-gray-50 dark:bg-gray-800 border-transparent opacity-60'
                                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800/50 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 print:hover:border-transparent'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors print:w-6 print:h-6 print:border-gray-300 ${completedSteps.includes(index) ? 'bg-green-500 border-green-500 print:bg-gray-100' : 'border-gray-300 group-hover:border-orange-400'
                                        }`}>
                                        {completedSteps.includes(index) ? <span className="text-white text-sm font-bold print:text-black">✓</span> : <span className="text-xs font-bold text-gray-400 print:text-black">{index + 1}</span>}
                                    </div>
                                    <p className={`text-base sm:text-lg leading-relaxed ${completedSteps.includes(index) ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white font-medium'} print:no-underline print:text-black print:text-sm`}>
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {recipe.notes && (
                        <section className="bg-yellow-50 dark:bg-yellow-500/10 p-6 rounded-3xl border-2 border-yellow-100 dark:border-yellow-500/20 print:p-4 print:rounded-none print:border-0 print:border-b print:border-gray-200 print:bg-transparent">
                            <h2 className="text-lg font-black text-yellow-900 dark:text-yellow-500 mb-2 print:text-base print:text-black">Chef's Notes</h2>
                            <p className="text-yellow-800/80 dark:text-yellow-200/80 leading-relaxed font-medium whitespace-pre-wrap print:text-black print:text-sm print:italic">
                                {recipe.notes}
                            </p>
                        </section>
                    )}

                    {/* Comments & Reviews Section */}
                    <section className="pt-8 border-t-2 border-gray-100 dark:border-gray-800/50 print:hidden">
                        <h2 className="text-2xl font-black mb-6 print:text-xl print:mb-3">Community Reviews ({recipe.comments?.length || 0})</h2>
                        
                        {isAuthenticated ? (
                            <form onSubmit={handleAddComment} className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm mb-8 print:hidden">
                                <div className="mb-4">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className={`text-2xl transition-all ${newRating >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="What did you think of this recipe?"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-900 outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all min-h-[120px] resize-none mb-4"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment}
                                    className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50"
                                >
                                    {isSubmittingComment ? 'Posting...' : 'Post Review'}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/50 mb-8 text-center print:hidden">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Please <Link to="/auth" className="text-orange-600 font-bold hover:underline">log in</Link> to leave a review.</p>
                            </div>
                        )}

                        {/* Comments List */}
                        {recipe.comments && recipe.comments.length > 0 ? (
                            <div className="space-y-6">
                                {recipe.comments.map((comment: any) => (
                                    <div key={comment.id} className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800/50 shadow-sm relative group print:p-2 print:border-0 print:border-b print:border-gray-200 print:rounded-none print:shadow-none">
                                        {(userId === comment.user?.id || isAdmin) && (
                                            <button 
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 text-sm font-bold bg-red-50 px-2 py-1 rounded-md print:hidden"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 print:mb-1 gap-1">
                                            <div>
                                                <span className="font-black text-gray-900 dark:text-white block print:text-black print:font-bold">{getDisplayName(comment.user) ?? 'Anonymous'}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider print:text-gray-600">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {comment.rating && (
                                                <div className="text-yellow-400 tracking-widest text-sm print:text-black print:text-xs">
                                                    {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium print:text-black print:text-xs">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 font-medium italic text-center py-8 print:text-black print:font-bold">No reviews yet. Be the first to share your thoughts!</p>
                        )}
                    </section>
                </main>
            </div>

            {/* Render Cook Mode Overlay */}
            {isCookModeOpen && (
                <CookMode 
                    recipeName={recipe.name}
                    instructions={steps}
                    ingredients={formattedIngredients}
                    onClose={() => setIsCookModeOpen(false)}
                    checkedIngredients={checkedIngredients}
                    setCheckedIngredients={setCheckedIngredients}
                />
            )}
            {swapModalOpen && swapTarget && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Choose Substitute</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                            You have multiple options for <span className="font-bold text-gray-700 dark:text-gray-300">{swapTarget.name}</span>. Which would you like to use?
                        </p>

                        <div className="space-y-2">
                            {swapOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        handleSwap(swapTarget.id, { name: opt.name, ingredientId: opt.id });
                                        setSwapModalOpen(false);
                                        toast.success(`Swapped for ${opt.name}`);
                                    }}
                                    className="w-full text-left px-5 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-200 dark:hover:border-orange-500/30 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold text-gray-800 dark:text-gray-200 transition-all flex justify-between items-center group"
                                >
                                    {opt.name}
                                    <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">Swap ➔</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setSwapModalOpen(false)}
                            className="w-full mt-6 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetail;
