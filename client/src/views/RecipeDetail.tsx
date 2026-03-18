// src/pages/RecipeDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { addIngredientsToShoppingList } from '../utils/shoppingUtils';
import { CompactNutritionDisplay } from '../components/recipes/CompactNutrition';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/userUtils';
import toast from 'react-hot-toast';

const RecipeDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    
    // Auth & User Context
    const { user, isAdmin, isAuthenticated, token } = useAuth();
    const userId = user?.id;

    // Sidebar Controls State
    const [multiplier, setMultiplier] = useState(1);
    const [showStaples, setShowStaples] = useState(false);
    const [missingIngredients, setMissingIngredients] = useState<any[]>([]);

    // Comment State
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState<number>(5);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    console.log("Recipe: ", recipe);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const [recipeRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/recipes/${slug}?userId=${userId}`)
                ]);

                const recipeResult = await recipeRes.json();

                if (recipeResult.status === 'success') {
                    setRecipe(recipeResult.data);
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

    const scaledAmount = (amount: number) => {
        const result = amount * multiplier;
        return Number.isInteger(result) ? result : result.toFixed(2);
    };

    const addToShoppingList = async () => {
        const itemsToAdd = missingIngredients.map((item: any) => ({
            ingredientId: item.ingredientId,
            name: item.name,
            amount: `${scaledAmount(item.amount)} ${item.unit?.abbreviation || ''}`.trim()
        }));
        await addIngredientsToShoppingList(itemsToAdd);
    };

    useEffect(() => {
        if (recipe) {
            if (showStaples){
                const ingredients = recipe.ingredients.filter((item: any) => !item.inPantry);
                setMissingIngredients(ingredients);
            } else {
                const ingredients = recipe.ingredients.filter((item: any) => !item.inPantry && !item.isStaple);
                setMissingIngredients(ingredients);
            }
        }
    }, [recipe, showStaples]);

    // --- Action Handlers ---

    const handleDeleteRecipe = async () => {
        if (!window.confirm("Are you sure you want to delete this recipe entirely?")) return;
        try {
            await fetch(`http://localhost:5000/api/recipes/${recipe.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
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
            const res = await fetch(`http://localhost:5000/api/recipes/${recipe.id}/comments`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ content: newComment, rating: newRating, userId })
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                // Update local state instantly so user sees their comment
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
        if (!window.confirm("Delete this comment?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setRecipe({
                    ...recipe,
                    comments: recipe.comments.filter((c: any) => c.id !== commentId)
                });
            }
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold text-xl">Prepping your kitchen...</div>;
    if (!recipe) return <div className="p-20 text-center text-red-500 font-bold">Recipe not found.</div>;

    const steps = recipe.instructions?.split('\n').filter((s: string) => s.trim() !== '') || [];

    return (
        <div className="max-w-5xl mx-auto p-6 pb-24">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">
                <Link to="/discovery" className="hover:text-orange-600 transition-colors">Discovery</Link>
                <span>/</span>
                {recipe.category && <span className="text-gray-600">{recipe.category.name}</span>}
                {recipe.subcategory && <><span>/</span><span className="text-orange-600">{recipe.subcategory.name}</span></>}
            </nav>

            {/* Hero Image Section */}
            <div className="w-full h-80 md:h-96 rounded-3xl overflow-hidden mb-8 relative shadow-sm">
                <img 
                    src={recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&q=80'} 
                    alt={recipe.name} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                
                {/* Admin/Author Controls overlayed on image */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {(isAdmin || (isAuthenticated && user?.id === recipe?.authorId)) && (
                        <Link to={`/edit-recipe/${recipe.slug}`}>
                            <button className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-xl font-black text-sm hover:bg-white transition-all shadow-lg">
                                ✏️ Edit
                            </button>
                        </Link>
                    )}
                    {isAdmin && (
                        <button onClick={handleDeleteRecipe} className="bg-red-500/90 backdrop-blur text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-red-600 transition-all shadow-lg">
                            🗑️ Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Main Header Info */}
            <header className="mb-10 text-center md:text-left">
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                    {recipe.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-gray-500 mb-6">
                    <span className="flex items-center gap-2">
                        👨‍🍳 By <span className="text-gray-900">{authorName}</span>
                    </span>
                    <span>•</span>
                    {avgRating ? (
                        <span className="text-yellow-500 flex items-center gap-1 text-base">
                            ⭐ {avgRating} <span className="text-gray-400 text-sm">({ratings.length} reviews)</span>
                        </span>
                    ) : (
                        <span>No ratings yet</span>
                    )}
                </div>

                <p className="text-lg text-gray-600 mb-6 font-medium leading-relaxed max-w-3xl mx-auto md:mx-0">
                    {recipe.summary || "A delicious recipe ready to be cooked."}
                </p>

                {/* Badges & Tags */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 items-center">
                    {recipe.matchPercentage && (
                        <span className="bg-orange-500 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md">
                            {recipe.matchPercentage}% Match
                        </span>
                    )}
                    {recipe.tags?.map((tag: any) => (
                        <span key={tag.id} className="bg-gray-100 text-gray-600 border border-gray-200 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
                            {tag.name}
                        </span>
                    ))}
                </div>
            </header>

            {/* Metadata Hero Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 bg-orange-50/50 border border-orange-100 rounded-3xl p-6">
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Prep Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.prepTime ? `${recipe.prepTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Cook Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.cookTime ? `${recipe.cookTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Total Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.totalTime ? `${recipe.totalTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Yields</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.servings ? recipe.servings * multiplier : '--'} servings</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-12">
                
                {/* Left Sidebar: Ingredients & Nutrition */}
                <aside className="lg:col-span-1 space-y-10">
                    <section>
                        <div className="flex flex-col gap-4 mb-6">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                Ingredients <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{recipe.ingredients?.length}</span>
                            </h2>
                            
                            {/* MOVED: Controls are now embedded in the Ingredients section */}
                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-3">
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {[1, 2, 3].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setMultiplier(val)}
                                            className={`flex-1 py-1.5 rounded-lg text-sm font-black transition-all ${multiplier === val
                                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {val}x
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowStaples(!showStaples)}
                                    className={`w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${showStaples
                                            ? 'bg-gray-800 text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {showStaples ? 'Showing All Staples' : 'Hiding Common Staples'}
                                </button>
                            </div>
                        </div>

                        {/* Missing Ingredients Alert directly above list */}
                        {missingIngredients.length > 0 && (
                            <div className="mb-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl shadow-sm">
                                <p className="text-orange-800 font-bold text-sm mb-3">You're missing {missingIngredients.length} items.</p>
                                <button 
                                    onClick={addToShoppingList} 
                                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                                >
                                    🛒 Add to Shopping List
                                </button>
                            </div>
                        )}

                        <ul className="space-y-3">
                            {recipe.ingredients.map((item: any) => (
                                <li key={item.id} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.inPantry ? 'bg-green-500' : 'bg-orange-300'}`} />
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                {scaledAmount(item.amount)} {item.unit?.name || ''}
                                            </p>
                                        </div>
                                    </div>
                                    {item.inPantry ? (
                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md">In Pantry</span>
                                    ) : (showStaples || !item.isStaple ) ? (
                                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">Missing</span>
                                        ) : <></>
                                    }
                                </li>
                            ))}
                        </ul>
                    </section>

                    <CompactNutritionDisplay nutrition={recipe.nutrition} />
                </aside>

                {/* Right Content: Instructions, Notes & Comments */}
                <main className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-2xl font-black mb-6">Instructions</h2>
                        <div className="space-y-4">
                            {steps.map((step: string, index: number) => (
                                <div key={index}
                                    onClick={() => setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index])}
                                    className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer flex gap-5 ${completedSteps.includes(index)
                                            ? 'bg-gray-50 border-transparent opacity-60'
                                            : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${completedSteps.includes(index) ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-orange-400'
                                        }`}>
                                        {completedSteps.includes(index) ? <span className="text-white text-sm font-bold">✓</span> : <span className="text-xs font-bold text-gray-400">{index + 1}</span>}
                                    </div>
                                    <p className={`text-lg leading-relaxed ${completedSteps.includes(index) ? 'line-through text-gray-500' : 'text-gray-800 font-medium'}`}>
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {recipe.notes && (
                        <section className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-100">
                            <h2 className="text-lg font-black text-yellow-900 mb-2">Chef's Notes</h2>
                            <p className="text-yellow-800/80 leading-relaxed font-medium">{recipe.notes}</p>
                        </section>
                    )}

                    {/* Comments & Reviews Section */}
                    <section className="pt-8 border-t-2 border-gray-100">
                        <h2 className="text-2xl font-black mb-6">Reviews & Comments ({recipe.comments?.length || 0})</h2>
                        
                        {/* New Comment Form */}
                        {isAuthenticated ? (
                            <form onSubmit={handleAddComment} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-8">
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
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-orange-400 focus:bg-white transition-all min-h-[120px] resize-none mb-4"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment}
                                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50"
                                >
                                    {isSubmittingComment ? 'Posting...' : 'Post Review'}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8 text-center">
                                <p className="text-gray-500 font-medium">Please <Link to="/login" className="text-orange-600 font-bold hover:underline">log in</Link> to leave a review.</p>
                            </div>
                        )}

                        {/* Comments List */}
                        {recipe.comments && recipe.comments.length > 0 ? (
                            <div className="space-y-6">
                                {recipe.comments.map((comment: any) => (
                                    <div key={comment.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 text-sm font-bold bg-red-50 px-2 py-1 rounded-md"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="font-black text-gray-900 block">{getDisplayName(comment.user) ?? 'Anonymous'}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {comment.rating && (
                                                <div className="text-yellow-400 tracking-widest text-sm">
                                                    {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed font-medium">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 font-medium italic text-center py-8">No reviews yet. Be the first to share your thoughts!</p>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RecipeDetail;
