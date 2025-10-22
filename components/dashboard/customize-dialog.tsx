/**
 * Dashboard Customization Dialog
 * Allows users to show/hide widgets and rearrange layout
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { WidgetConfig } from '@/features/dashboard/types';
import { WIDGET_REGISTRY, getAvailableWidgets, getWidgetsByCategory } from '@/features/dashboard/widget-registry';
import { saveDashboardLayout, resetDashboardLayout } from '@/features/dashboard/layout-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GripVertical } from 'lucide-react';

interface CustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgets: WidgetConfig[];
  onLayoutChange: (widgets: WidgetConfig[]) => void;
  features?: Record<string, boolean>;
  userRole?: string;
}

export function CustomizeDialog({
  open,
  onOpenChange,
  currentWidgets,
  onLayoutChange,
  features = {},
  userRole = 'viewer',
}: CustomizeDialogProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(currentWidgets);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const availableWidgets = getAvailableWidgets(features, userRole);

  const handleToggleWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDashboardLayout(widgets);
      if (result.success) {
        onLayoutChange(widgets);
        toast({
          title: 'Layout saved',
          description: 'Your dashboard layout has been saved successfully.',
        });
        onOpenChange(false);
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

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetDashboardLayout();
      if (result.success) {
        toast({
          title: 'Layout reset',
          description: 'Your dashboard has been reset to the default layout.',
        });
        onOpenChange(false);
        // Reload page to get default layout
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset layout',
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
      setIsResetting(false);
    }
  };

  const categories = [
    { key: 'financial', label: 'Financial' },
    { key: 'banking', label: 'Banking' },
    { key: 'operations', label: 'Operations' },
    { key: 'ai', label: 'AI & Insights' },
    { key: 'actions', label: 'Actions' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Show or hide widgets to personalize your dashboard view.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => {
            const categoryWidgets = getWidgetsByCategory(cat.key);
            const availableTypes = new Set(availableWidgets.map((w) => w.type));

            return (
              <TabsContent key={cat.key} value={cat.key}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {categoryWidgets.map((widgetMeta) => {
                      const isAvailable = availableTypes.has(widgetMeta.type);
                      const widgetConfig = widgets.find((w) => w.type === widgetMeta.type);
                      const isVisible = widgetConfig?.isVisible ?? false;

                      return (
                        <div
                          key={widgetMeta.type}
                          className={`flex items-start space-x-3 p-4 rounded-lg border ${
                            !isAvailable
                              ? 'opacity-50 bg-muted/50'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div className="flex items-center pt-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Checkbox
                            id={widgetMeta.type}
                            checked={isVisible}
                            onCheckedChange={() =>
                              widgetConfig && handleToggleWidget(widgetConfig.id)
                            }
                            disabled={!isAvailable || !widgetConfig}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={widgetMeta.type}
                                className="font-medium cursor-pointer"
                              >
                                {widgetMeta.title}
                              </Label>
                              {!isAvailable && (
                                <Badge variant="secondary" className="text-xs">
                                  {widgetMeta.requiredFeatures?.[0] || 'Unavailable'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {widgetMeta.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isSaving}
          >
            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Layout
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
