import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { IngredientAutocomplete } from './IngredientAutocomplete';
import type { IngredientRow } from '../../models/Utils';
import { QuantityInput } from './QuantityInput';

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
      className={`flex flex-col sm:flex-row gap-3 p-3 sm:p-2 bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all
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
                    {isAdmin && (
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
        <button 
            type="button" 
            onClick={() => removeIngredientRow(index)} 
            className="sm:hidden p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-1"
        >
            <X size={20} />
        </button>
      </div>

      {/* Bottom Row / Right Block */}
      <div className="flex items-center gap-2 w-full sm:w-auto pl-2 sm:pl-0">
        <div className="flex flex-1 sm:flex-none items-center gap-2">
            <QuantityInput
                value={ingredient.amount}
                onChange={(val) => handleIngredientChange(index, 'amount', val)}
                placeholder="Qty"
                className={`${inputBaseClass} text-center sm:w-20 md:w-24 shrink min-w-[60px] ${isAmountMissing ? errorClass : defaultClass}`}
            />

            <select
                required
                title={selectedUnit ? selectedUnit.name : 'Select a unit'}
                value={ingredient.unitId}
                onChange={(e) => handleIngredientChange(index, 'unitId', e.target.value)}
                className={`${inputBaseClass} cursor-pointer sm:w-32 md:w-[150px] shrink min-w-[80px] ${isUnitMissing ? errorClass : defaultClass}`}
            >
                <option value="" disabled>Unit</option>
                {taxonomy.units.map((u: any) => (
                    <option key={u.id} value={u.id} title={u.name}>
                        {u.abbreviation} {u.name && u.name !== u.abbreviation ? `- ${u.name}` : ''}
                    </option>
                ))}
            </select>
        </div>

        <select
            value={ingredient.modifierId || ''}
            onChange={(e) => handleIngredientChange(index, 'modifierId', e.target.value)}
            className={`${inputBaseClass} cursor-pointer flex-1 sm:w-32 md:w-32 min-w-[90px] ${defaultClass}`}
        >
            <option value="">(None)</option>
            {taxonomy.modifiers?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {/* Desktop Delete Button - Hidden on mobile */}
        <button 
            type="button" 
            onClick={() => removeIngredientRow(index)} 
            className="hidden sm:block p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0" 
            title="Remove Ingredient"
        >
            ✕
        </button>
      </div>
    </div>
  );
};
