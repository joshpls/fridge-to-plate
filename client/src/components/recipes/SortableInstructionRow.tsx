// client/src/components/recipes/SortableInstructionRow.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export const SortableInstructionRow = ({ id, item, stepNumber, onChange, onRemove }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-3 bg-white dark:bg-gray-900 p-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 shadow-sm group">
            <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pt-2.5 touch-none">
                <GripVertical size={20} />
            </div>
            <div className="pt-2.5 font-black text-gray-400 dark:text-gray-500 w-6 text-right shrink-0">
                {stepNumber}.
            </div>
            <textarea
                value={item.text}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Describe this step... (e.g. Preheat oven to 400°F)"
                rows={2}
                className="flex-1 bg-transparent outline-none resize-y text-gray-800 dark:text-gray-100 placeholder:text-gray-400 leading-relaxed text-sm sm:text-base py-1"
            />
            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors shrink-0 self-center"
                title="Remove step"
            >
                ✕
            </button>
        </div>
    );
};
