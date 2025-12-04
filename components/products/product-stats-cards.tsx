'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Boxes, DollarSign } from "lucide-react"
import type { ProductStats } from './types'

interface ProductStatsCardsProps {
  stats: ProductStats;
  formatCurrency: (amount: number) => string;
}

export function ProductStatsCards({ stats, formatCurrency }: ProductStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Items</CardDescription>
          <CardTitle className="text-2xl">{stats.totalItems}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Products & services</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Products</CardDescription>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Boxes className="h-5 w-5 text-blue-600" />
            {stats.products}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Physical items</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Services</CardDescription>
          <CardTitle className="text-2xl">{stats.services}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Service offerings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Low Stock</CardDescription>
          <CardTitle className={`text-2xl ${stats.lowStock > 0 ? 'text-yellow-600' : ''}`}>
            {stats.lowStock}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xs ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
            {stats.lowStock > 0 ? 'Need reorder' : 'All stocked'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Inventory Value</CardDescription>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {formatCurrency(stats.totalValue)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Total stock value</p>
        </CardContent>
      </Card>
    </div>
  )
}
