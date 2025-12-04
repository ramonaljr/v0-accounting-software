'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Item } from './types'

interface QuickStatsCardProps {
  items: Item[];
}

export function QuickStatsCard({ items }: QuickStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>Item breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Sales Items</span>
            <span className="font-medium">{items.filter(i => i.isSalesItem).length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Purchase Items</span>
            <span className="font-medium">{items.filter(i => i.isPurchaseItem).length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Items</span>
            <span className="font-medium">{items.filter(i => i.isActive).length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Inactive Items</span>
            <span className="font-medium">{items.filter(i => !i.isActive).length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
