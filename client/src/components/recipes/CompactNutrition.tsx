import React from 'react';

interface NutritionProps {
    nutrition: any;
}

export const CompactNutritionDisplay: React.FC<NutritionProps> = ({ nutrition }) => {
    if (!nutrition || Object.keys(nutrition).length === 0) return null;

    // 1. Define the "Big Four" macros to highlight at the top
    const primaryKeys = ['calories', 'protein', 'carbohydrates', 'fat'];

    // 2. Separate remaining keys (filtering out the primary ones and nested objects for the top row)
    const secondaryKeys = Object.keys(nutrition).filter(
        key => !primaryKeys.includes(key.toLowerCase())
    );

    const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    return (
        <section className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden">
            <div className="flex items-center pt-4 px-2 justify-between mb-4">
                <h2 className="text-xl font-black tracking-tight">Nutrition</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200">
                    Per Serving
                </span>
            </div>
            {/* Primary Macros Row */}
            <div className="grid grid-cols-4 divide-x-2 divide-gray-50 bg-gray-50/50 border-b-2 border-gray-100">
                {primaryKeys.map((key) => {
                    const val = nutrition[key];
                    // Handle cases where fat might be an object { total: '10g', ... }
                    const displayVal = typeof val === 'object' ? val.total : val;

                    return (
                        <div key={key} className="py-4 px-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                {key === 'carbohydrates' ? 'Carbs' : key}
                            </p>
                            <p className="text-sm font-black text-gray-900">
                                {displayVal || '--'}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Info (Fiber, Sugar, Vitamins etc.) */}
            {secondaryKeys.length > 0 && (
                <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2">
                    {secondaryKeys.map((key) => {
                        const val = nutrition[key];

                        // Skip rendering if it's a nested object (like vitamins) to keep it compact,
                        // or render it as a simple string if possible.
                        if (typeof val === 'object' && val !== null) {
                            return Object.entries(val).map(([subKey, subVal]) => (
                                <div key={subKey} className="flex justify-between text-[11px] border-b border-gray-50 pb-1">
                                    <span className="text-gray-500 font-medium">{formatKey(subKey)}</span>
                                    <span className="font-bold text-gray-700">{subVal as string}</span>
                                </div>
                            ));
                        }

                        return (
                            <div key={key} className="flex justify-between text-[11px] border-b border-gray-50 pb-1">
                                <span className="text-gray-500 font-medium">{formatKey(key)}</span>
                                <span className="font-bold text-gray-700">{val}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
