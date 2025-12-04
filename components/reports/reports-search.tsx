'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown } from 'lucide-react'

interface ReportsSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateReport?: () => void
}

export function ReportsSearch({ searchQuery, onSearchChange, onCreateReport }: ReportsSearchProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Type report name here"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0D0D0D]"
            onClick={onCreateReport}
          >
            Create new report
          </Button>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
