'use client'

import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import type { Bom, BomItemDetail } from './types'

interface ViewBomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bom: Bom | null;
  formatCurrency: (amount: number) => string;
}

function getStatusBadge(status: string, isActive: boolean, isDefault: boolean) {
  return (
    <div className="flex gap-1">
      {status === 'Submitted' && isActive ? (
        <Badge variant="default">Active</Badge>
      ) : status === 'Draft' ? (
        <Badge variant="outline">Draft</Badge>
      ) : status === 'Cancelled' ? (
        <Badge variant="destructive">Cancelled</Badge>
      ) : (
        <Badge variant="secondary">{status}</Badge>
      )}
      {isDefault && <Badge className="bg-yellow-500">Default</Badge>}
    </div>
  );
}

export function ViewBomDialog({
  open,
  onOpenChange,
  bom,
  formatCurrency,
}: ViewBomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>BOM Details - {bom?.bomNo}</DialogTitle>
          <DialogDescription>
            {bom?.itemName} ({bom?.itemCode})
          </DialogDescription>
        </DialogHeader>
        {bom && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-500">Quantity</Label>
                <p className="font-medium">{bom.quantity}</p>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <p>{getStatusBadge(bom.status, bom.isActive, bom.isDefault)}</p>
              </div>
              <div>
                <Label className="text-gray-500">Total Cost</Label>
                <p className="font-medium">{formatCurrency(bom.totalCost)}</p>
              </div>
            </div>

            {bom.items && bom.items.length > 0 && (
              <div className="space-y-2">
                <Label>Raw Materials</Label>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.items?.map((item: BomItemDetail, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.itemName}</div>
                              <div className="text-sm text-gray-500">{item.itemCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.stockQty || item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <Label className="text-gray-500">Raw Material Cost</Label>
                <p className="font-medium">{formatCurrency(bom.rawMaterialCost)}</p>
              </div>
              <div>
                <Label className="text-gray-500">Operating Cost</Label>
                <p className="font-medium">{formatCurrency(bom.operatingCost)}</p>
              </div>
              <div>
                <Label className="text-gray-500">Cost Per Unit</Label>
                <p className="font-medium">{formatCurrency(bom.totalCost / bom.quantity)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
