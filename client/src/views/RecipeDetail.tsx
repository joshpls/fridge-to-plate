import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const RecipeDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // State for Scaling, Pantry, and Staples Filter
    const [multiplier, setMultiplier] = useState(1);
    const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
    const [showStaples, setShowStaples] = useState(false); // Default to filtering staples out

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const userId = '00000000-0000-0000-0000-000000000000';

                const [recipeRes, pantryRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/recipes/${slug}?userId=${userId}`),
                    fetch(`http://localhost:5000/api/pantry?userId=${userId}`)
                ]);

                const recipeResult = await recipeRes.json();
                const pantryResult = await pantryRes.json();

                if (recipeResult.status === 'success') {
                    setRecipe(recipeResult.data);
                }

                if (pantryResult.status === 'success') {
                    setPantryIds(new Set(pantryResult.data.map((p: any) => p.id)));
                }
            } catch (error) {
                console.error("Failed to load recipe detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    const addToGroceryList = async () => {
        const userId = '00000000-0000-0000-0000-000000000000';

        // We only send the items that were identified as missing
        const itemsToAdd = missingIngredients.map((item: any) => ({
            ingredientId: item.ingredientId,
            amount: scaleAmount(item.amount),
        }));

        try {
            const response = await fetch(`http://localhost:5000/api/shopping-list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, items: itemsToAdd })
            });

            if (response.ok) {
                alert(`Added ${itemsToAdd.length} items to your list!`);
            }
        } catch (err) {
            console.error("Shopping list error:", err);
        }
    };

    const scaleAmount = (amount: string) => {
        return amount.replace(/(\d+(?:\.\d+)?)/g, (match) => {
            const result = parseFloat(match) * multiplier;
            return Number.isInteger(result) ? result.toString() : result.toFixed(2);
        });
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Prepping your kitchen...</div>;
    if (!recipe) return <div className="p-20 text-center">Recipe not found.</div>;

    // Logic to determine which items are truly missing based on the Staples toggle
    const missingIngredients = recipe.ingredients?.filter((item: any) => {
        const inPantry = pantryIds.has(item.ingredientId);
        const isStaple = item.ingredient.isStaple;
        
        // If it's in the pantry, it's not missing.
        // If we are filtering staples (showStaples = false), don't count staples as missing.
        if (inPantry) return false;
        if (!showStaples && isStaple) return false;
        return true;
    }) || [];

    const steps = recipe.instructions?.split('\n').filter((s: string) => s.trim() !== '') || [];

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24">
            <Link to="/discovery" className="text-orange-600 font-semibold mb-6 inline-block hover:underline">
                ← Back to Discovery
            </Link>

            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">{recipe.name}</h1>
                    <div className="flex gap-3">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                            {recipe.matchPercentage}% Match
                        </span>
                        {recipe.isVegan && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">🌱 Vegan</span>}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    {/* Staples Toggle */}
                    <button 
                        onClick={() => setShowStaples(!showStaples)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                            showStaples 
                            ? 'bg-gray-800 text-white border-gray-800' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        {showStaples ? 'Showing All Items' : 'Hiding Staples'}
                    </button>

                    {/* Multiplier Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
                        {[1, 2, 3].map((val) => (
                            <button
                                key={val}
                                onClick={() => setMultiplier(val)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all ${multiplier === val
                                        ? 'bg-white shadow-sm text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {val}x
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Missing Ingredient Alert Banner - Only shows if non-staples are missing */}
            {missingIngredients.length > 0 && (
                <div className="mb-8 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-2 rounded-full text-xl">🛒</div>
                        <div>
                            <h3 className="font-bold text-red-800">Missing Ingredients</h3>
                            <p className="text-red-600 text-sm">You need {missingIngredients.length} more items to finish this.</p>
                        </div>
                    </div>
                    {/* Placeholder for your Grocery List button */}
                    <button className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-shadow shadow-lg shadow-red-200"
                        onClick={addToGroceryList}
                    >
                        Add to List
                    </button>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-12">
                <aside className="md:col-span-1">
                    <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">Ingredients</h2>
                    <ul className="space-y-3">
                        {recipe.ingredients?.map((item: any) => {
                            const inPantry = pantryIds.has(item.ingredientId);
                            const isStaple = item.ingredient.isStaple;
                            
                            // Visual logic: Highlight red only if it's missing AND (we are showing staples OR it's not a staple)
                            const showAsMissing = !inPantry && (showStaples || !isStaple);

                            return (
                                <li
                                    key={item.id}
                                    className={`flex flex-col p-3 rounded-xl transition-colors ${
                                        showAsMissing ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`font-medium ${showAsMissing ? 'text-red-700' : 'text-gray-800'}`}>
                                            {item.ingredient.name}
                                            {isStaple && <span className="ml-1 text-[10px] text-gray-400 font-normal italic">(Staple)</span>}
                                        </span>
                                        {showAsMissing && (
                                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                                Missing
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">{scaleAmount(item.amount)}</span>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                <main className="md:col-span-2">
                    <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">Instructions</h2>
                    <div className="space-y-4">
                        {steps.map((step: string, index: number) => (
                            <div
                                key={index}
                                onClick={() => setCompletedSteps(prev =>
                                    prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                                )}
                                className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 ${completedSteps.includes(index)
                                        ? 'bg-gray-50 border-transparent opacity-50'
                                        : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                                    }`}
                            >
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${completedSteps.includes(index) ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-orange-400'
                                    }`}>
                                    {completedSteps.includes(index) && <span className="text-white text-xs">✓</span>}
                                </div>
                                <p className={`text-lg leading-relaxed ${completedSteps.includes(index) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default RecipeDetail;