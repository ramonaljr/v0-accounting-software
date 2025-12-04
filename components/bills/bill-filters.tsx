'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { BillStatus } from './types'

interface BillFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: BillStatus | '';
  onStatusFilterChange: (status: BillStatus | '') => void;
}

export function BillFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: BillFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bills..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: string) => onStatusFilterChange(value as BillStatus | '')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
