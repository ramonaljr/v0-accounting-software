'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Item } from './types'

interface ItemViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onEdit: () => void;
  formatCurrency: (amount: number) => string;
}

export function ItemViewDialog({ open, onOpenChange, item, onEdit, formatCurrency }: ItemViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Item Code</p>
                <p className="font-medium">{item.itemCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Item Name</p>
                <p className="font-medium">{item.itemName}</p>
              </div>
            </div>
            {item.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p>{item.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <Badge variant={item.isStockItem ? "default" : "secondary"}>
                  {item.isStockItem ? 'Product' : 'Service'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={item.isActive ? "default" : "secondary"}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Standard Rate</p>
                <p className="font-medium">{formatCurrency(item.standardRate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Group</p>
                <p className="font-medium">{item.item_groups?.groupName || '-'}</p>
              </div>
            </div>
            {item.isStockItem && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="font-medium">{item.currentStock ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder Level</p>
                  <p className="font-medium">{item.reorderLevel ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder Qty</p>
                  <p className="font-medium">{item.reorderQty ?? '-'}</p>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Badge variant={item.isSalesItem ? "default" : "outline"}>
                {item.isSalesItem ? 'Sales Item' : 'Not for Sale'}
              </Badge>
              <Badge variant={item.isPurchaseItem ? "default" : "outline"}>
                {item.isPurchaseItem ? 'Purchase Item' : 'Not for Purchase'}
              </Badge>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
