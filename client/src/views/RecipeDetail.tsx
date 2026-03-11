import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export const RecipeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const userId = '00000000-0000-0000-0000-000000000000'; // Your TEMP_USER_ID
        const response = await fetch(`http://localhost:5000/api/recipes/${slug}?userId=${userId}`);
        const result = await response.json();
        if (result.status === 'success') setRecipe(result.data);
      } catch (error) {
        console.error("Failed to load recipe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) return <div className="p-20 text-center animate-pulse">Prepping your kitchen...</div>;
  if (!recipe) return <div className="p-20 text-center">Recipe not found.</div>;

  const steps = recipe.instructions?.split('\n').filter((s: string) => s.trim() !== '') || [];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {/* Back Navigation */}
      <Link to="/discovery" className="text-orange-600 font-semibold mb-6 inline-block hover:underline">
        ← Back to Discovery
      </Link>

      <header className="mb-8">
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">{recipe.name}</h1>
        <div className="flex gap-3">
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
            {recipe.matchPercentage}% Match
          </span>
          {recipe.isVegan && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">🌱 Vegan</span>}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-12">
        {/* Ingredients Column */}
        <aside className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">Ingredients</h2>
          <ul className="space-y-3">
            {recipe.ingredients?.map((item: any) => (
              <li key={item.id} className="flex flex-col">
                <span className="font-medium text-gray-800">{item.ingredient.name}</span>
                <span className="text-sm text-gray-500">{item.amount}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Instructions Column with Checklist */}
        <main className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">Instructions</h2>
          <div className="space-y-4">
            {steps.map((step: string, index: number) => (
              <div 
                key={index}
                onClick={() => setCompletedSteps(prev => 
                  prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                )}
                className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 ${
                  completedSteps.includes(index) 
                    ? 'bg-gray-50 border-transparent opacity-50' 
                    : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                }`}
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  completedSteps.includes(index) ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-orange-400'
                }`}>
                  {completedSteps.includes(index) && <span className="text-white">✓</span>}
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
