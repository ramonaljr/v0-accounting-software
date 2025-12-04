'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import type { Item } from './types'

interface LowStockAlertsProps {
  lowStockItems: Item[];
}

export function LowStockAlerts({ lowStockItems }: LowStockAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Inventory Alerts
        </CardTitle>
        <CardDescription>Items needing attention</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">All items in stock</p>
        ) : (
          <div className="space-y-3">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.itemName}</p>
                  <p className="text-xs text-gray-500">{item.itemCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-700">
                    {item.currentStock ?? 0} in stock
                  </p>
                  <p className="text-xs text-gray-500">
                    Reorder at {item.reorderLevel}
                  </p>
                </div>
              </div>
            ))}
            {lowStockItems.length > 5 && (
              <p className="text-xs text-center text-gray-500">
                +{lowStockItems.length - 5} more items need attention
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
