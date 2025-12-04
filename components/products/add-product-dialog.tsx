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
  DialogTrigger,
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
import { Plus } from "lucide-react"
import type { ItemGroup, Uom } from './types'

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemGroups: ItemGroup[];
  uoms: Uom[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  itemGroups,
  uoms,
  isPending,
  onSubmit,
}: AddProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product/Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product/Service</DialogTitle>
          <DialogDescription>Create a new item in your catalog</DialogDescription>
        </DialogHeader>
        <form action={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input id="itemName" name="itemName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input id="itemCode" name="itemCode" placeholder="Auto-generated if empty" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemGroupId">Item Group</Label>
                <Select name="itemGroupId">
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
              <div className="space-y-2">
                <Label htmlFor="stockUomId">Unit of Measure</Label>
                <Select name="stockUomId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {uoms.map(uom => (
                      <SelectItem key={uom.id} value={uom.id}>
                        {uom.uomName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardRate">Standard Rate</Label>
                <Input id="standardRate" name="standardRate" type="number" step="0.01" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input id="reorderLevel" name="reorderLevel" type="number" step="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderQty">Reorder Qty</Label>
                <Input id="reorderQty" name="reorderQty" type="number" step="1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch id="isStockItem" name="isStockItem" defaultChecked />
                <input type="hidden" name="isStockItem" value="false" />
                <Label htmlFor="isStockItem" className="text-sm">Stock Item</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isSalesItem" name="isSalesItem" defaultChecked />
                <input type="hidden" name="isSalesItem" value="false" />
                <Label htmlFor="isSalesItem" className="text-sm">Sales Item</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isPurchaseItem" name="isPurchaseItem" defaultChecked />
                <input type="hidden" name="isPurchaseItem" value="false" />
                <Label htmlFor="isPurchaseItem" className="text-sm">Purchase Item</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
