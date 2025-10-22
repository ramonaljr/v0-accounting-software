/**
 * Draggable Widget Wrapper
 * Wraps dashboard widgets to enable drag-and-drop functionality
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface DraggableWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode?: boolean;
  isVisible?: boolean;
}

export function DraggableWidget({
  id,
  children,
  isEditMode = false,
  isVisible = true,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.3,
  };

  if (!isVisible && !isEditMode) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-white border rounded hover:bg-gray-50 shadow-sm"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      )}
      {isEditMode && !isVisible && (
        <div className="absolute inset-0 bg-gray-100/80 z-[5] flex items-center justify-center rounded-lg">
          <span className="text-sm text-gray-500 font-medium">Hidden</span>
        </div>
      )}
      {children}
    </div>
  );
}
