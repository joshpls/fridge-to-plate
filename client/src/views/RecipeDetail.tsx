import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addIngredientsToShoppingList } from '../utils/shoppingUtils';
import { CompactNutritionDisplay } from '../components/recipes/CompactNutrition';

const RecipeDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // State for Scaling, Pantry, and Staples Filter
    const [multiplier, setMultiplier] = useState(1);
    const [showStaples, setShowStaples] = useState(false);
    const [missingIngredients, setMissingIngredients] = useState([]);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const userId = '00000000-0000-0000-0000-000000000000';

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
    }, [slug]);

    const scaledAmount = (amount: number) => {
        const result = amount * multiplier;
        return Number.isInteger(result) ? result : result.toFixed(2);
    };

    const addToShoppingList = async () => {
        const itemsToAdd = missingIngredients.map((item: any) => ({
            ingredientId: item.ingredientId,
            name: item.name,
            // Format the float amount and abbreviation together
            amount: `${scaledAmount(item.amount)} ${item.unit?.abbreviation || ''}`.trim()
        }));

        addIngredientsToShoppingList(itemsToAdd);
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

            {/* Main Header */}
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                            {recipe.name}
                        </h1>

                        <p className="text-lg text-gray-600 mb-6 font-medium leading-relaxed max-w-3xl">
                            {recipe.summary || "A delicious recipe ready to be cooked."}
                        </p>

                        {/* Badges & Tags */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {recipe.matchPercentage && (
                                <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    {recipe.matchPercentage}% Match
                                </span>
                            )}
                            {recipe.tags?.map((tag: any) => (
                                <span key={tag.id} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <button
                            onClick={() => setShowStaples(!showStaples)}
                            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${showStaples
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-500 border-2 border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            {showStaples ? 'Showing All Items' : 'Hiding Staples'}
                        </button>

                        <div className="flex bg-gray-50 p-1 rounded-xl border-2 border-gray-100">
                            {[1, 2, 3].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setMultiplier(val)}
                                    className={`px-5 py-2 rounded-lg font-black transition-all ${multiplier === val
                                        ? 'bg-white shadow-sm text-orange-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {val}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Metadata Hero Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 bg-orange-50/50 border border-orange-100 rounded-3xl p-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Prep Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.prepTime ? `${recipe.prepTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Cook Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.cookTime ? `${recipe.cookTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Total Time</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.totalTime ? `${recipe.totalTime}m` : '--'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-800/50 mb-1">Yields</span>
                    <span className="text-2xl font-black text-orange-900">{recipe.servings ? recipe.servings * multiplier : '--'} servings</span>
                </div>
            </div>

            {/* Missing Ingredients Banner */}
            {missingIngredients.length > 0 && (
                <div className="mb-10 bg-orange-50 border-2 border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full text-2xl shadow-sm">🛒</div>
                        <div>
                            <h3 className="font-black text-orange-900">Missing Ingredients</h3>
                            <p className="text-orange-700/80 font-medium text-sm">You need {missingIngredients.length} more items to finish this recipe.</p>
                        </div>
                    </div>
                    <button onClick={addToShoppingList} className="bg-orange-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-500 transition-all shadow-md hover:shadow-lg">
                        Add to List
                    </button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-12">
                {/* Left Sidebar: Ingredients & Nutrition */}
                <aside className="lg:col-span-1 space-y-10">
                    <section>
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                            Ingredients <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{recipe.ingredients?.length}</span>
                        </h2>
                        <ul className="space-y-4">
                            {recipe.ingredients
                                .map((item: any) => (
                                    <li key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${item.inPantry ? 'bg-green-500' : 'bg-orange-200'}`} />
                                            <div>
                                                <p className="font-bold text-gray-800">
                                                    {item.name}
                                                    {item.isStaple && <span className="ml-1 text-[10px] text-gray-400 uppercase tracking-tighter font-black italic">(Staple)</span>}
                                                </p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                    {scaledAmount(item.amount)} {item.unit?.name || ''}
                                                </p>
                                            </div>
                                        </div>
                                        {item.inPantry ? (
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">In Pantry</span>
                                        ) : (showStaples || !item.isStaple ) ? (
                                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Missing</span>
                                            ) : <></>
                                        }
                                    </li>
                                ))}
                        </ul>
                    </section>

                    {/* Nutrition Section (If it exists) */}
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

                    {/* Notes Section */}
                    {recipe.notes && (
                        <section className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-100">
                            <h2 className="text-lg font-black text-yellow-900 mb-2">Chef's Notes</h2>
                            <p className="text-yellow-800/80 leading-relaxed font-medium">{recipe.notes}</p>
                        </section>
                    )}

                    {/* Comments Section */}
                    <section className="pt-8 border-t-2 border-gray-100">
                        <h2 className="text-2xl font-black mb-6">Comments ({recipe.comments?.length || 0})</h2>
                        {recipe.comments && recipe.comments.length > 0 ? (
                            <div className="space-y-6">
                                {recipe.comments.map((comment: any) => (
                                    <div key={comment.id} className="bg-gray-50 p-5 rounded-2xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-900">{comment.user?.email.split('@')[0]}</span>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 font-medium italic">No comments yet. Be the first to share your thoughts!</p>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RecipeDetail;
