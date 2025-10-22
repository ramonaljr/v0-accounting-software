/**
 * Sortable Dashboard Layout
 * Enables drag-and-drop reordering of dashboard widgets
 */

'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Edit3, Save, X } from 'lucide-react';
import type { WidgetConfig } from '@/features/dashboard/types';
import { saveDashboardLayout } from '@/features/dashboard/layout-actions';
import { useToast } from '@/hooks/use-toast';

interface SortableDashboardProps {
  widgets: WidgetConfig[];
  onLayoutChange: (widgets: WidgetConfig[]) => void;
  children: (props: {
    widgets: WidgetConfig[];
    isEditMode: boolean;
  }) => React.ReactNode;
}

export function SortableDashboard({
  widgets,
  onLayoutChange,
  children,
}: SortableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);

        const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex);

        // Update row positions based on new order
        const updatedWidgets = reorderedWidgets.map((widget, index) => ({
          ...widget,
          position: {
            ...widget.position,
            row: Math.floor(index / 2) + 1, // Assuming 2 widgets per row
            column: (index % 2) * 6, // 0 or 6 for left/right column
          },
        }));

        onLayoutChange(updatedWidgets);
      }
    },
    [widgets, onLayoutChange]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDashboardLayout(widgets);
      if (result.success) {
        toast({
          title: 'Layout saved',
          description: 'Your dashboard layout has been saved successfully.',
        });
        setIsEditMode(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save layout',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    // Optionally reload original layout here
  };

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <div>
      {/* Edit Mode Toggle */}
      <div className="flex justify-end mb-4 gap-2">
        {!isEditMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Layout
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Layout'}
            </Button>
          </>
        )}
      </div>

      {/* Info Banner in Edit Mode */}
      {isEditMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Edit Mode:</strong> Drag widgets using the grip handle to reorder them.
            Click "Save Layout" when done.
          </p>
        </div>
      )}

      {/* Sortable Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {children({ widgets, isEditMode })}
        </SortableContext>

        {/* Drag Overlay - shows preview of dragged item */}
        <DragOverlay>
          {activeWidget ? (
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-xl opacity-90">
              <div className="font-semibold">{activeWidget.title}</div>
              <div className="text-sm text-gray-500 mt-1">
                Dragging widget...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
