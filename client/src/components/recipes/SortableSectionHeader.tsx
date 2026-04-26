import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export const SortableSectionHeader = ({ id, title, onChange, onRemove }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-orange-50 dark:bg-orange-500/10 p-3 rounded-xl border-2 border-orange-200 dark:border-orange-500/30 group my-4 shadow-sm">
            <div {...attributes} {...listeners} className="cursor-grab text-orange-400 hover:text-orange-600 p-1 touch-none">
                <GripVertical size={20} />
            </div>
            <input
                type="text"
                value={title}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Section Name (e.g., The Sauce)"
                className="flex-1 bg-transparent font-black uppercase tracking-widest text-orange-800 dark:text-orange-400 outline-none placeholder:text-orange-300 dark:placeholder:text-orange-800/50"
            />
            <button
                type="button"
                onClick={onRemove}
                className="hidden sm:block p-2 md:p-3 text-gray-300 hover:text-red-600 transition-colors shrink-0"
                title="Remove Section"
            >
                ✕
            </button>
        </div>
    );
};
