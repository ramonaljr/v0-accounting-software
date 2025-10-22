/**
 * Dashboard Preset Selector
 * Allows users to load role-based or industry-specific dashboard presets
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crown,
  Shield,
  Calculator,
  Users,
  Eye,
  ShoppingCart,
  Briefcase,
  Globe,
  Check,
  Loader2,
} from 'lucide-react';
import type { PresetRole, IndustryType, WidgetConfig } from '@/features/dashboard/types';
import {
  getPresetByRole,
  getPresetByIndustry,
  PRESET_METADATA,
  type PresetMetadata,
} from '@/features/dashboard/presets';
import { useToast } from '@/hooks/use-toast';

interface PresetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole?: PresetRole;
  onLoadPreset: (widgets: WidgetConfig[], presetName: string) => void;
}

const ICON_MAP = {
  Crown,
  Shield,
  Calculator,
  Users,
  Eye,
  ShoppingCart,
  Briefcase,
  Globe,
};

export function PresetSelector({
  open,
  onOpenChange,
  currentRole = 'owner',
  onLoadPreset,
}: PresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const rolePresets = Object.values(PRESET_METADATA).filter((p) => p.category === 'role');
  const industryPresets = Object.values(PRESET_METADATA).filter((p) => p.category === 'industry');

  const handleLoadPreset = async () => {
    if (!selectedPreset) return;

    setIsLoading(true);
    try {
      const metadata = PRESET_METADATA[selectedPreset];
      let widgets: WidgetConfig[];

      if (metadata.category === 'role') {
        widgets = getPresetByRole(selectedPreset as PresetRole);
      } else {
        widgets = getPresetByIndustry(selectedPreset as IndustryType);
      }

      // Simulate loading for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      onLoadPreset(widgets, metadata.name);
      toast({
        title: 'Preset loaded',
        description: `${metadata.name} dashboard layout has been applied.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPresetCard = (preset: PresetMetadata) => {
    const Icon = ICON_MAP[preset.icon as keyof typeof ICON_MAP] || Crown;
    const isSelected = selectedPreset === preset.id;
    const isRecommended = preset.recommended?.includes(currentRole);

    return (
      <Card
        key={preset.id}
        className={`cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-blue-500 border-blue-500'
            : 'hover:border-gray-400'
        }`}
        onClick={() => setSelectedPreset(preset.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <CardTitle className="text-base">{preset.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {preset.widgetCount} widgets
                </p>
              </div>
            </div>
            {isSelected && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
          </div>
          {isRecommended && (
            <Badge variant="secondary" className="w-fit mt-2">
              Recommended for you
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {preset.description}
          </CardDescription>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Load Dashboard Preset</DialogTitle>
          <DialogDescription>
            Choose a pre-configured layout optimized for your role or industry.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="role" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role">By Role</TabsTrigger>
            <TabsTrigger value="industry">By Industry</TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {rolePresets.map(renderPresetCard)}
            </div>
          </TabsContent>

          <TabsContent value="industry" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {industryPresets.map(renderPresetCard)}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedPreset && (
              <span>
                Selected: <strong>{PRESET_METADATA[selectedPreset].name}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLoadPreset}
              disabled={!selectedPreset || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Preset
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
