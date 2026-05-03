import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { IngredientAutocomplete } from './IngredientAutocomplete';
import type { IngredientRow } from '../../models/Utils';

// Extend the interface to include our new admin props
interface SortableRowProps extends IngredientRow {
    isAdmin?: boolean;
    onCreateNewIngredient?: (name: string, index: number) => Promise<boolean>;
}

export const SortableIngredientRow = ({ 
  id, index, ingredient, taxonomy, handleIngredientChange, removeIngredientRow,
  isAdmin, onCreateNewIngredient
}: SortableRowProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveNew = async () => {
    if (!newName.trim() || !onCreateNewIngredient) return;
    setIsSaving(true);
    const success = await onCreateNewIngredient(newName.trim(), index);
    if (success) {
        setIsCreating(false);
        setNewName('');
    }
    setIsSaving(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-2 bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all
        ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15 scale-[1.02] shadow-md' : 'border-gray-100 dark:border-gray-800/50 hover:border-orange-200'}`}
    >
      {/* Top Row on Mobile / Left Side on Desktop */}
      <div className="flex items-center gap-2 w-full sm:flex-1">
        <div 
          {...attributes} 
          {...listeners} 
          className="text-gray-300 hover:text-gray-500 dark:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0 z-50 flex items-center gap-1 sm:gap-2">
            {isCreating ? (
                <div className="flex-1 flex gap-1 items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border-2 border-orange-400 shadow-sm overflow-hidden">
                    <input 
                        type="text" 
                        autoFocus
                        disabled={isSaving}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New ingredient name..."
                        className="flex-1 bg-transparent px-2 py-1 outline-none text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[100px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSaveNew(); }
                            if (e.key === 'Escape') setIsCreating(false);
                        }}
                    />
                    <button 
                        type="button" 
                        onClick={handleSaveNew} 
                        disabled={isSaving || !newName.trim()}
                        className="p-1.5 text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-colors shrink-0"
                        title="Save Ingredient"
                    >
                        {isSaving ? <span className="animate-pulse">...</span> : <Check size={16}/>}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setIsCreating(false)} 
                        disabled={isSaving}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors shrink-0"
                        title="Cancel"
                    >
                        <X size={16}/>
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex-1 min-w-0">
                        <IngredientAutocomplete
                            value={ingredient.ingredientId}
                            ingredients={taxonomy.ingredients}
                            onChange={(newId) => handleIngredientChange(index, 'ingredientId', newId)}
                        />
                    </div>
                    {isAdmin && (
                        <button 
                            type="button" 
                            onClick={() => setIsCreating(true)}
                            className="shrink-0 p-2 text-orange-500 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-xl transition-colors border border-orange-200 dark:border-orange-500/30"
                            title="Create New Ingredient"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </>
            )}
        </div>

        {/* Mobile Delete Button */}
        <button 
            type="button" 
            onClick={() => removeIngredientRow(index)} 
            className="sm:hidden p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
            <X size={20} />
        </button>
      </div>

      {/* Bottom Row on Mobile / Right Side on Desktop */}
      <div className="flex items-center gap-2 pl-1 sm:pl-0 w-full sm:w-auto">
        <input
            required
            type="number"
            step="0.01"
            placeholder="Qty"
            value={ingredient.amount}
            onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
            className="flex-1 sm:w-20 md:w-24 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-center min-w-[60px]"
        />

        <select
            required
            value={ingredient.unitId}
            onChange={(e) => handleIngredientChange(index, 'unitId', e.target.value)}
            className="flex-1 sm:w-28 md:w-32 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-gray-600 cursor-pointer min-w-[80px]"
        >
            <option value="" disabled>Unit</option>
            {taxonomy.units.map((u: any) => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
        </select>

        <select
            value={ingredient.modifierId || ''}
            onChange={(e) => handleIngredientChange(index, 'modifierId', e.target.value)}
            className="flex-1 md:w-32 p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border border-transparent focus:border-orange-300 font-bold text-gray-600 cursor-pointer min-w-[100px]"
        >
            <option value="">(None)</option>
            {taxonomy.modifiers?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {/* Desktop Delete Button */}
        <button 
            type="button" 
            onClick={() => removeIngredientRow(index)} 
            className="hidden sm:block p-2 md:p-3 text-gray-300 hover:text-red-500 transition-colors shrink-0" 
            title="Remove Ingredient"
        >
            ✕
        </button>
      </div>
    </div>
  );
};
