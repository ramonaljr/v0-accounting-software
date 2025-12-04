'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import type { Item, BomItem } from './types'

interface CreateBomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  bomItems: BomItem[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BomItem, value: string | number) => void;
  formatCurrency: (amount: number) => string;
}

export function CreateBomDialog({
  open,
  onOpenChange,
  items,
  bomItems,
  isPending,
  onSubmit,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  formatCurrency,
}: CreateBomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New BOM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bill of Materials</DialogTitle>
          <DialogDescription>
            Define the raw materials and components needed to manufacture a product.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Finished Product *</Label>
              <Select name="itemId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemCode} - {item.itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min="1" step="0.01" defaultValue="1" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional description" />
          </div>

          {/* BOM Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Raw Materials / Components</Label>
              <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Rate</TableHead>
                    <TableHead className="w-32">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bomItems.map((bomItem, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={bomItem.itemId}
                          onValueChange={(value) => onUpdateItem(index, 'itemId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.itemCode} - {item.itemName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={bomItem.quantity}
                          onChange={(e) => onUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bomItem.rate}
                          onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bomItem.quantity * bomItem.rate)}
                      </TableCell>
                      <TableCell>
                        {bomItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => onRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create BOM
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
