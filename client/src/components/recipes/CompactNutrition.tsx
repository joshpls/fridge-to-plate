import type { NutritionProps } from '../../models/Utils';

export const CompactNutritionDisplay = ({ nutrition }: NutritionProps) => {
    if (!nutrition || Object.keys(nutrition).length === 0) return null;

    const primaryKeys = ['calories', 'protein', 'carbohydrates', 'fat'];

    const secondaryKeys = Object.keys(nutrition).filter(
        key => !primaryKeys.includes(key.toLowerCase())
    );

    const formatKey = (key: string) => {
        if (key === 'omega3') return 'Omega-3';
        if (key === 'omega6') return 'Omega-6';
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return (
        <section className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 overflow-hidden">
            <div className="flex items-center pt-4 px-2 justify-between mb-4">
                <h2 className="text-xl font-black tracking-tight">Nutrition</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                    Per Serving
                </span>
            </div>
            
            {/* Primary Macros Row */}
            <div className="grid grid-cols-4 divide-x-2 divide-gray-50 dark:divide-gray-800 bg-gray-50 dark:bg-gray-800/50 border-b-2 border-gray-100 dark:border-gray-800/50">
                {primaryKeys.map((key) => {
                    const val = nutrition[key as keyof typeof nutrition];
                    // Handle cases where fat is an object { total: '10g', ... }
                    const displayVal = typeof val === 'object' && val !== null ? (val as any).total : val;

                    return (
                        <div key={key} className="py-4 px-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                {key === 'carbohydrates' ? 'Carbs' : key}
                            </p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                                {displayVal || '--'}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Info (Fiber, Sugar, Fat Breakdown, Vitamins etc.) */}
            {(secondaryKeys.length > 0 || (nutrition.fat && Object.keys(nutrition.fat).length > 1)) && (
                <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2">
                    
                    {/* Render secondary string fields */}
                    {secondaryKeys.map((key) => {
                        const val = nutrition[key as keyof typeof nutrition];
                        if (typeof val === 'object') return null; // handled below

                        return (
                            <div key={key} className="flex justify-between text-[11px] border-b border-gray-50 dark:border-gray-800/50 pb-1">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{formatKey(key)}</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{val as string}</span>
                            </div>
                        );
                    })}

                    {/* Render fat sub-fields (ignoring the 'total' field) */}
                    {nutrition.fat && typeof nutrition.fat === 'object' && Object.entries(nutrition.fat).map(([subKey, subVal]) => {
                        if (subKey === 'total' || !subVal) return null; 

                        return (
                            <div key={`fat-${subKey}`} className="flex justify-between text-[11px] border-b border-gray-50 dark:border-gray-800/50 pb-1">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{formatKey(subKey)}</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{subVal as string}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
