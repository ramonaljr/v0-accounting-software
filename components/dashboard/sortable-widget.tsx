/**
 * Sortable Widget Wrapper
 * Wraps dashboard tiles with drag-and-drop functionality
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
}

export function SortableWidget({ id, isEditMode, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isEditMode && 'ring-2 ring-blue-200 rounded-lg',
        isDragging && 'z-50 ring-blue-400'
      )}
    >
      {/* Drag Handle - Only visible in edit mode */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
        >
          <div className="p-2 bg-white border-2 border-blue-300 rounded-lg shadow-lg hover:bg-blue-50 hover:border-blue-400 transition-colors">
            <GripVertical className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div className={cn(isEditMode && 'pointer-events-none')}>{children}</div>
    </div>
  );
}
