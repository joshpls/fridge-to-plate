import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { IngredientAutocomplete } from './IngredientAutocomplete';
import type { IngredientRow } from '../../models/Utils';
import { QuantityInput } from './QuantityInput';

interface SortableRowProps extends IngredientRow {
    canCreateIngredients?: boolean;
    onCreateNewIngredient?: (name: string, index: number) => Promise<boolean>;
}

export const SortableIngredientRow = ({ 
  id, index, ingredient, taxonomy, handleIngredientChange, removeIngredientRow,
  canCreateIngredients, onCreateNewIngredient
}: SortableRowProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    zIndex: isDragging ? 49 : Math.max(1, 48 - index),
    opacity: isDragging ? 0.8 : 1,
  };

  const handleSaveNew = async () => {
    if (!newName.trim() || !onCreateNewIngredient) return;
    setIsSaving(true);
    const success = await onCreateNewIngredient(newName.trim(), index);
    if (success) {
        setIsCreating(false);
        setNewName('');
        setSearchQuery('');
    }
    setIsSaving(false);
  };

  const handleStartCreating = () => {
      setIsCreating(true);
      setNewName(searchQuery); 
  };

  // --- Dynamic Validation Styles ---
  const isAmountMissing = !ingredient.amount || String(ingredient.amount).trim() === '';
  const isUnitMissing = !ingredient.unitId;

  const inputBaseClass = "p-2.5 sm:p-3 rounded-xl outline-none border-2 font-bold transition-all duration-200 w-full";
  const errorClass = "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 placeholder-red-400 dark:placeholder-red-400/70 text-red-700 dark:text-red-400 focus:border-red-500";
  const defaultClass = "border-transparent bg-gray-50 dark:bg-gray-800 focus:border-orange-300 text-gray-600 dark:text-white";

  const selectedUnit = taxonomy.units.find((u: any) => u.id === ingredient.unitId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row gap-3 p-3 sm:p-2 bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all relative
        ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15 scale-[1.02] shadow-md' : 'border-gray-100 dark:border-gray-800/50 hover:border-orange-200'}`}
    >
      {/* Top Row / Left Block */}
      <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[250px]">
        <div 
          {...attributes} 
          {...listeners} 
          className="text-gray-300 hover:text-gray-500 dark:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0 z-40 flex items-center gap-2">
          {isCreating ? (
            <div className="flex-1 flex gap-1 items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border-2 border-orange-400 shadow-sm overflow-hidden">
              <input
                type="text"
                autoFocus
                disabled={isSaving}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New ingredient..."
                className="flex-1 bg-transparent px-2 py-1 outline-none text-sm font-bold text-gray-700 dark:text-gray-200 min-w-0"
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
                {isSaving ? <span className="animate-pulse">...</span> : <Check size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                disabled={isSaving}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors shrink-0"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
            ) : (
                <>
                    <div className="flex-1 min-w-0">
                        <IngredientAutocomplete
                            value={ingredient.ingredientId}
                            ingredients={taxonomy.ingredients}
                            onChange={(newId) => handleIngredientChange(index, 'ingredientId', newId)}
                            searchValue={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    </div>
                    {canCreateIngredients && (
                        <button 
                            type="button" 
                            onClick={handleStartCreating}
                            className="shrink-0 p-2 text-orange-500 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-xl transition-colors border border-orange-200 dark:border-orange-500/30"
                            title="Create New Ingredient"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </>
            )}
        </div>

        {/* Mobile Delete Button - Hidden on desktop */}
        
      </div>

      {/* Bottom Row / Right Block */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full pl-0 sm:pl-0">
        <div className="grid grid-cols-12 gap-2 w-full">
            <div className="col-span-4">
                <QuantityInput
                    value={ingredient.amount}
                    onChange={(val) => handleIngredientChange(index, "amount", val)}
                    placeholder="Qty"
                    className={`${inputBaseClass} text-center w-full px-1 ${isAmountMissing ? errorClass : defaultClass}`}
                />
            </div>
            <div className="col-span-8">
                <select
                    required
                    title={selectedUnit ? selectedUnit.name : "Select a unit"}
                    value={ingredient.unitId}
                    onChange={(e) => handleIngredientChange(index, "unitId", e.target.value)}
                    className={`${inputBaseClass} cursor-pointer w-full truncate ${isUnitMissing ? errorClass : defaultClass}`}
                >
                    <option value="" disabled>Unit</option>
                    {taxonomy.units.map((u: any) => (
                        <option key={u.id} value={u.id} title={u.name}>
                            {u.abbreviation} {u.name && u.name !== u.abbreviation ? `- ${u.name}` : ""}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex items-center gap-2 w-full">
            <select
                value={ingredient.modifierId || ""}
                onChange={(e) => handleIngredientChange(index, "modifierId", e.target.value)}
                className={`${inputBaseClass} cursor-pointer flex-1 min-w-0 truncate ${defaultClass}`}
            >
                <option value="">(None)</option>
                {taxonomy.modifiers?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <label className="flex items-center justify-center gap-1 px-2.5 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer text-[11px] font-bold text-gray-600 dark:text-gray-300 select-none shrink-0">
                <input
                    type="checkbox"
                    checked={!!ingredient.isOptional}
                    onChange={(e) => handleIngredientChange(index, "isOptional", e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
                Optional
            </label>

            {/* Mobile Delete Button */}
            <button 
                type="button" 
                onClick={() => removeIngredientRow(index)} 
                className="sm:hidden p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold text-xs shrink-0 flex items-center justify-center"
                title="Remove"
            >
                ✕
            </button>
        </div>
      </div>
    </div>
  );
};