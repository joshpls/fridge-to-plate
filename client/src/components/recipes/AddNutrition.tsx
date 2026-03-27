import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Nutrition } from "../../models/Recipe";

interface NutritionProps {
    nutrition: Nutrition;
    handleNutritionChange: (field: string, value: string, isFatSubfield?: boolean) => void;
}

export const AddNutrition = ({ nutrition, handleNutritionChange }: NutritionProps) => {
    const [showDetailed, setShowDetailed] = useState(false);
    const hasAutoExpanded = useRef(false);

    useEffect(() => {
        if (hasAutoExpanded.current) return;

        const detailedKeys = ['fiber', 'sugar', 'sodium', 'potassium', 'vitaminA', 'vitaminC', 'calcium', 'iron'];
        const fatKeys = ['saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat', 'transFat'];

        const hasDetailedData =
            detailedKeys.some(k => {
                const value = nutrition[k as keyof typeof nutrition];
                return value !== undefined && value !== '';
            }) ||
            fatKeys.some(k => {
                const value = nutrition.fat[k as keyof typeof nutrition.fat];
                return value !== undefined && value !== '';
            });

        if (hasDetailedData) {
            setShowDetailed(true);
            hasAutoExpanded.current = true;
        }
    }, [nutrition]);

    return (
        <section className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2 mb-6">
                <h2 className="text-xl font-black text-gray-800">6. Nutrition Information</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-md">Optional</span>
            </div>

            {/* Core Macros Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-orange-300 focus-within:bg-white transition-colors">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Calories</label>
                    <input type="number" value={nutrition.calories} onChange={(e) => handleNutritionChange('calories', e.target.value)} placeholder="e.g. 450" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-orange-300 focus-within:bg-white transition-colors">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Protein</label>
                    <input type="text" value={nutrition.protein} onChange={(e) => handleNutritionChange('protein', e.target.value)} placeholder="e.g. 24g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-orange-300 focus-within:bg-white transition-colors">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Carbs</label>
                    <input type="text" value={nutrition.carbohydrates} onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)} placeholder="e.g. 45g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-orange-300 focus-within:bg-white transition-colors">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Fat</label>
                    <input type="text" value={nutrition.fat.total} onChange={(e) => handleNutritionChange('total', e.target.value, true)} placeholder="e.g. 12g" className="w-full bg-transparent outline-none font-black text-xl text-gray-900" />
                </div>
            </div>

            {/* Expansion Toggle */}
            <button
                type="button"
                onClick={() => setShowDetailed(!showDetailed)}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-gray-500 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors border border-transparent hover:border-orange-100"
            >
                {showDetailed ? 'Hide Detailed Nutrition' : 'Add Detailed Nutrition (Vitamins, Minerals, Fiber...)'}
                {showDetailed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Detailed Breakdown */}
            {showDetailed && (
                <div className="mt-8 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300">

                    {/* Fat Breakdown & Carbs */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Fat Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Saturated Fat', key: 'saturatedFat' },
                                    { label: 'Polyunsaturated', key: 'polyunsaturatedFat' },
                                    { label: 'Monounsaturated', key: 'monounsaturatedFat' },
                                    { label: 'Trans Fat', key: 'transFat' },
                                ].map(fat => (
                                    <div key={fat.key} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg">
                                        <label className="w-32 text-sm font-bold text-gray-600">{fat.label}</label>
                                        <input type="text" value={nutrition.fat[fat.key as keyof typeof nutrition.fat] || ''} onChange={(e) => handleNutritionChange(fat.key, e.target.value, true)} placeholder="e.g. 5g" className="flex-1 bg-white p-2 border border-gray-200 rounded-lg outline-none focus:border-orange-400 text-sm font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Carbs Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Dietary Fiber', key: 'fiber' },
                                    { label: 'Sugar', key: 'sugar' }
                                ].map(carb => (
                                    <div key={carb.key} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg">
                                        <label className="w-32 text-sm font-bold text-gray-600">{carb.label}</label>
                                        <input type="text" value={nutrition[carb.key] || ''} onChange={(e) => handleNutritionChange(carb.key, e.target.value)} placeholder="e.g. 15g" className="flex-1 bg-white p-2 border border-gray-200 rounded-lg outline-none focus:border-orange-400 text-sm font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Minerals & Vitamins */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Minerals & Sodium</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Sodium', key: 'sodium', placeholder: 'e.g. 3635mg' },
                                    { label: 'Potassium', key: 'potassium', placeholder: 'e.g. 1705mg' },
                                    { label: 'Calcium', key: 'calcium', placeholder: 'e.g. 240mg' },
                                    { label: 'Iron', key: 'iron', placeholder: 'e.g. 14mg' },
                                ].map(min => (
                                    <div key={min.key} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg">
                                        <label className="w-32 text-sm font-bold text-gray-600">{min.label}</label>
                                        <input type="text" value={nutrition[min.key] || ''} onChange={(e) => handleNutritionChange(min.key, e.target.value)} placeholder={min.placeholder} className="flex-1 bg-white p-2 border border-gray-200 rounded-lg outline-none focus:border-orange-400 text-sm font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Vitamins</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Vitamin A', key: 'vitaminA', placeholder: 'e.g. 1667IU' },
                                    { label: 'Vitamin C', key: 'vitaminC', placeholder: 'e.g. 83mg' }
                                ].map(vit => (
                                    <div key={vit.key} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg">
                                        <label className="w-32 text-sm font-bold text-gray-600">{vit.label}</label>
                                        <input type="text" value={nutrition[vit.key] || ''} onChange={(e) => handleNutritionChange(vit.key, e.target.value)} placeholder={vit.placeholder} className="flex-1 bg-white p-2 border border-gray-200 rounded-lg outline-none focus:border-orange-400 text-sm font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </section>
    );
};
