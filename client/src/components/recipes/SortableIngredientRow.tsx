import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { IngredientAutocomplete } from './IngredientAutocomplete';
import type { IngredientRow } from '../../models/Utils';

export const SortableIngredientRow = ({ 
  id, index, ingredient, taxonomy, handleIngredientChange, removeIngredientRow 
}: IngredientRow) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 items-center bg-white p-2 rounded-2xl border-2 transition-all
        ${isDragging ? 'border-orange-500 bg-orange-50 scale-[1.02] shadow-md' : 'border-gray-100 hover:border-orange-200'}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="text-gray-300 hover:text-gray-500 pl-2 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={20} />
      </div>

      <IngredientAutocomplete
          value={ingredient.ingredientId}
          ingredients={taxonomy.ingredients}
          onChange={(newId) => handleIngredientChange(index, 'ingredientId', newId)}
      />

      <input
          required
          type="number"
          step="0.01"
          placeholder="Qty"
          value={ingredient.amount}
          onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
          className="w-24 p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-center"
      />

      <select
          required
          value={ingredient.unitId}
          onChange={(e) => handleIngredientChange(index, 'unitId', e.target.value)}
          className="w-32 p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-gray-600 cursor-pointer"
      >
          <option value="" disabled>Unit</option>
          {taxonomy.units.map((u: any) => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
      </select>

      <button type="button" onClick={() => removeIngredientRow(index)} className="p-3 text-gray-300 hover:text-red-500 transition-colors" title="Remove Ingredient">
          ✕
      </button>
    </div>
  );
};
