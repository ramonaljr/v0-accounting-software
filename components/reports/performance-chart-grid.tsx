'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  showPeriodSelect?: boolean
}

function ChartCard({ title, subtitle, children, showPeriodSelect = false }: ChartCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {showPeriodSelect && (
          <select className="text-xs border border-gray-300 rounded px-2 py-1">
            <option>This year to date</option>
          </select>
        )}
      </div>
      {children}
    </div>
  )
}

function AgingChartLegend() {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-3 h-3 rounded-full bg-[#D4AF37]"></span>
        <span className="text-gray-700">$0.00 Current</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-3 h-3 rounded-full bg-[#D4AF37]/70"></span>
        <span className="text-gray-700">$0.00 1-7 days</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-3 h-3 rounded-full bg-[#D4AF37]/50"></span>
        <span className="text-gray-700">$0.00 8-15 days</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-3 h-3 rounded-full bg-[#D4AF37]/30"></span>
        <span className="text-gray-700">$0.00 &gt;</span>
      </div>
    </div>
  )
}

export function PerformanceChartGrid() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Performance center</h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-sm">
                Create custom charts
              </Button>
              <Button variant="outline" className="text-sm flex items-center gap-2">
                Quick add charts
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0D0D0D] text-sm">
                + Add new chart
              </Button>
            </div>
          </div>

          {/* Info Bar */}
          <div className="flex items-center justify-between p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37]">ⓘ</span>
                <span><strong>Industry:</strong> not set</span>
              </div>
              <span>|</span>
              <span><strong>Revenue:</strong> Less than $500K</span>
              <span>|</span>
              <span><strong>Location:</strong> 49670</span>
              <span>|</span>
              <span><strong>Accounting method:</strong> Accrual basis</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">11 of 25 charts created</span>
              <Button variant="ghost" size="sm">Export</Button>
              <Button variant="ghost" size="sm">Settings</Button>
              <a href="#" className="text-blue-600 hover:underline">Give feedback</a>
            </div>
          </div>

          <div className="mb-4">
            <button className="text-sm text-blue-600 hover:underline">Customize Layout</button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AR Aging Chart */}
          <ChartCard title="Accounts receivable by aging" subtitle="As of today">
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40 rounded-full border-8 border-gray-200"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total A/R amount</div>
              <AgingChartLegend />
            </div>
          </ChartCard>

          {/* AP Aging Chart */}
          <ChartCard title="Accounts payable by aging" subtitle="As of today">
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40 rounded-full border-8 border-gray-200"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total A/P amount</div>
              <AgingChartLegend />
            </div>
          </ChartCard>

          {/* Expenses by Time */}
          <ChartCard title="Expenses by time" showPeriodSelect>
            <div className="h-48 flex items-end justify-between gap-2">
              <div className="flex-1 h-full bg-gray-100 rounded-t"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total expenses</div>
            </div>
          </ChartCard>

          {/* Revenue by Time */}
          <ChartCard title="Revenue by time" showPeriodSelect>
            <div className="h-48 flex items-end justify-between gap-2">
              <div className="flex-1 h-full bg-gray-100 rounded-t"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total revenue</div>
            </div>
          </ChartCard>

          {/* Placeholder Charts */}
          {[1, 2, 3, 4].map((_, idx) => (
            <ChartCard key={idx} title={`Chart ${idx + 5}`} showPeriodSelect>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                <span className="text-gray-400 text-sm">Chart placeholder</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">$0.00</div>
              </div>
            </ChartCard>
          ))}
        </div>
      </div>
    </div>
  )
}
