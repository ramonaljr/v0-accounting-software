'use client'

import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { KPIData } from './types'

const GROWTH_KPIS: KPIData[] = [
  { name: 'Revenue', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Cost of Goods Sold', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Total Expenses', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
]

const PROFITABILITY_KPIS: KPIData[] = [
  { name: 'Gross Profit', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Gross Profit Margin', lastMonth: 'N/A', prevPeriod: 'N/A', variance: 'N/A', variancePct: 'N/A' },
  { name: 'Net Profit', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Net Profit Margin', lastMonth: 'N/A', prevPeriod: 'N/A', variance: 'N/A', variancePct: 'N/A' },
  { name: 'Operating Expenses', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Net Operating Income', lastMonth: '$0', prevPeriod: '$0', variance: '$0', variancePct: 'N/A' },
  { name: 'Operating Margin', lastMonth: 'N/A', prevPeriod: 'N/A', variance: 'N/A', variancePct: 'N/A' },
]

interface KPIScorecardProps {
  expandedKPIs: string[]
  onToggleKPI: (kpiName: string) => void
}

function KPIRow({ kpi }: { kpi: KPIData }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-12 py-3 text-sm text-gray-700">{kpi.name}</td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.lastMonth}</td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.prevPeriod}</td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variance}</td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variancePct}</td>
      <td className="px-4 py-3 text-right">
        <a href="#" className="text-sm text-blue-600 hover:underline">View</a>
      </td>
    </tr>
  )
}

export function KPIScorecard({ expandedKPIs, onToggleKPI }: KPIScorecardProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* KPI Scorecard Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">KPI Scorecard</h2>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-[#D4AF37] hover:underline">Learn more</a>
              <a href="#" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Feedback
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Period</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>Last month</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Compare with</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>Previous period</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Category</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input type="text" placeholder="Search" className="max-w-xs" />
            </div>
          </div>

          <p className="text-xs text-gray-500">Updated 2 minutes ago</p>
        </div>

        {/* KPI Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">KPI</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  <div>Last month</div>
                  <div className="font-normal text-gray-500">Sep 2025</div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  <div>Previous period</div>
                  <div className="font-normal text-gray-500">Aug 2025</div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Finance Category */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <td colSpan={6} className="px-4 py-3">
                  <button
                    onClick={() => onToggleKPI('Finance')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                  >
                    {expandedKPIs.includes('Finance') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Finance
                  </button>
                </td>
              </tr>
              {expandedKPIs.includes('Finance') && (
                <>
                  {/* Growth Subcategory */}
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={6} className="px-8 py-2">
                      <button className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <ChevronDown className="h-4 w-4" />
                        Growth
                      </button>
                    </td>
                  </tr>
                  {GROWTH_KPIS.map((kpi, idx) => (
                    <KPIRow key={idx} kpi={kpi} />
                  ))}

                  {/* Profitability Subcategory */}
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={6} className="px-8 py-2">
                      <button className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <ChevronDown className="h-4 w-4" />
                        Profitability
                      </button>
                    </td>
                  </tr>
                  {PROFITABILITY_KPIS.map((kpi, idx) => (
                    <KPIRow key={idx} kpi={kpi} />
                  ))}
                </>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>1 - 10 of 10 items</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-900">Page</button>
              <input
                type="number"
                defaultValue="1"
                className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                readOnly
              />
              <span>of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
