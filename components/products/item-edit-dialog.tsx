'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { Item, ItemGroup } from './types'

interface ItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  itemGroups: ItemGroup[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export function ItemEditDialog({
  open,
  onOpenChange,
  item,
  itemGroups,
  isPending,
  onSubmit,
  onCancel,
}: ItemEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update item details</DialogDescription>
        </DialogHeader>
        {item && (
          <form action={onSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-itemName">Item Name *</Label>
                <Input
                  id="edit-itemName"
                  name="itemName"
                  defaultValue={item.itemName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  rows={2}
                  defaultValue={item.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-itemGroupId">Item Group</Label>
                <Select name="itemGroupId" defaultValue={item.itemGroupId || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.groupName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-standardRate">Standard Rate</Label>
                  <Input
                    id="edit-standardRate"
                    name="standardRate"
                    type="number"
                    step="0.01"
                    defaultValue={item.standardRate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                  <Input
                    id="edit-reorderLevel"
                    name="reorderLevel"
                    type="number"
                    step="1"
                    defaultValue={item.reorderLevel || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reorderQty">Reorder Qty</Label>
                  <Input
                    id="edit-reorderQty"
                    name="reorderQty"
                    type="number"
                    step="1"
                    defaultValue={item.reorderQty || ''}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="edit-isActive"
                  name="isActive"
                  defaultChecked={item.isActive}
                />
                <input type="hidden" name="isActive" value="false" />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
