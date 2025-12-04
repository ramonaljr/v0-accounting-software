'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Search, Eye, Pencil } from "lucide-react"
import type { Item } from './types'

interface ProductCatalogTableProps {
  items: Item[];
  filteredItems: Item[];
  searchQuery: string;
  filterType: 'all' | 'product' | 'service';
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: 'all' | 'product' | 'service') => void;
  onViewItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onAddItem: () => void;
  formatCurrency: (amount: number) => string;
}

export function ProductCatalogTable({
  items,
  filteredItems,
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  onViewItem,
  onEditItem,
  onAddItem,
  formatCurrency,
}: ProductCatalogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Catalog
        </CardTitle>
        <CardDescription>Items you sell to customers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products and services..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="product">Products Only</SelectItem>
              <SelectItem value="service">Services Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{items.length === 0 ? 'No products or services added yet' : 'No items match your search'}</p>
            <p className="text-sm mt-2">
              {items.length === 0
                ? 'Add items to quickly populate invoices and track sales'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {items.length === 0 && (
              <Button className="mt-4" variant="outline" onClick={onAddItem}>
                Add Your First Item
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isStockItem ? "default" : "secondary"}>
                      {item.isStockItem ? 'Product' : 'Service'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.item_groups?.groupName || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.standardRate)}</TableCell>
                  <TableCell className="text-right">
                    {item.isStockItem ? (
                      <span className={item.currentStock && item.reorderLevel && item.currentStock <= item.reorderLevel ? 'text-yellow-600 font-medium' : ''}>
                        {item.currentStock ?? 0}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
