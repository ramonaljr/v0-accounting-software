'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Layers, Loader2, CheckCircle, Star, Trash2, Eye } from 'lucide-react'
import type { Bom } from './types'

interface BomTableProps {
  boms: Bom[];
  loading: boolean;
  isPending: boolean;
  onView: (id: string) => void;
  onSubmit: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCancel: (id: string) => void;
  onCreateFirst: () => void;
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

export function BomTable({
  boms,
  loading,
  isPending,
  onView,
  onSubmit,
  onSetDefault,
  onCancel,
  onCreateFirst,
  formatCurrency,
}: BomTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Bills of Materials ({boms.length})
        </CardTitle>
        <CardDescription>Product recipes and material requirements</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : boms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No BOMs found</p>
            <Button className="mt-4" variant="outline" onClick={onCreateFirst}>
              Create Your First BOM
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOM No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Raw Material Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell className="font-mono text-sm">{bom.bomNo}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bom.itemName}</div>
                        <div className="text-sm text-gray-500">{bom.itemCode}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{bom.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bom.rawMaterialCost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(bom.totalCost)}</TableCell>
                    <TableCell>{getStatusBadge(bom.status, bom.isActive, bom.isDefault)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onView(bom.id)}
                          disabled={isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {bom.status === 'Draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => onSubmit(bom.id)}
                            disabled={isPending}
                            title="Submit BOM"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {bom.status === 'Submitted' && !bom.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-yellow-600"
                            onClick={() => onSetDefault(bom.id)}
                            disabled={isPending}
                            title="Set as Default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {(bom.status === 'Draft' || bom.status === 'Submitted') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => onCancel(bom.id)}
                            disabled={isPending}
                            title="Cancel BOM"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
