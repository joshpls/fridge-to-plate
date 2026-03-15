import React from 'react';

interface NutritionProps {
  nutrition: any;
}

export const Nutrition: React.FC<NutritionProps> = ({ nutrition }) => {
  if (!nutrition || Object.keys(nutrition).length === 0) return null;

  const renderValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-4">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="flex justify-between items-center text-sm">
              <span className="text-gray-500 capitalize">
                {subKey.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="font-bold text-gray-700">{subValue as string}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="font-black text-gray-900">{value}</span>;
  };

  // Define a priority order for the main stats you want at the top
  const priority = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar'];
  
  const sortedKeys = Object.keys(nutrition).sort((a, b) => {
    const indexA = priority.indexOf(a.toLowerCase());
    const indexB = priority.indexOf(b.toLowerCase());
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <section className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black tracking-tight">Nutrition</h2>
        <span className="text-[10px] font-black uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200">
          Per Serving
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedKeys.map((key) => {
          const value = nutrition[key];
          const isObject = typeof value === 'object' && value !== null;

          return (
            <div 
              key={key} 
              className={`pb-4 border-b border-gray-200 last:border-0 last:pb-0`}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-600 capitalize font-bold">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                {!isObject && renderValue(value)}
                {isObject && value.total && (
                  <span className="font-black text-gray-900">{value.total}</span>
                )}
              </div>
              {isObject && renderValue(value)}
            </div>
          );
        })}
      </div>
    </section>
  );
};
