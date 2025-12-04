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
import type { Supplier, BillItem } from './types'

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  billItems: BillItem[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BillItem, value: string | number) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function CreateBillDialog({
  open,
  onOpenChange,
  suppliers,
  billItems,
  isPending,
  onSubmit,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  formatCurrency,
}: CreateBillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bill</DialogTitle>
          <DialogDescription>
            Record a new vendor bill or purchase invoice.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Vendor *</Label>
              <Select name="supplierId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierInvoiceNo">Vendor Invoice #</Label>
              <Input id="supplierInvoiceNo" name="supplierInvoiceNo" placeholder="Vendor's ref #" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postingDate">Bill Date *</Label>
              <Input id="postingDate" name="postingDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          {/* Bill Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Rate</TableHead>
                    <TableHead className="w-28">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="Item description"
                          value={item.itemName}
                          onChange={(e) => onUpdateItem(index, 'itemName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => onUpdateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.qty * item.rate)}
                      </TableCell>
                      <TableCell>
                        {billItems.length > 1 && (
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
            <div className="text-right font-medium">
              Total: {formatCurrency(billItems.reduce((sum, item) => sum + (item.qty * item.rate), 0))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Notes</Label>
            <Input id="remarks" name="remarks" placeholder="Optional notes" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Bill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
