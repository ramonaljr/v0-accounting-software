'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

const SAMPLE_REPORTS = [
  { name: 'Company Overview', label: 'OPPORTUNITYOS REPORT' },
  { name: 'Sales Performance', label: 'OPPORTUNITYOS REPORT' },
  { name: 'Expenses Performance', label: 'OPPORTUNITYOS REPORT' },
]

export function ManagementReportsTable() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Created by
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Last modified
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Report period
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_REPORTS.map((report, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{report.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#D4AF37] text-[#0D0D0D] rounded">
                        {report.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">Accunza</td>
                  <td className="px-4 py-4 text-sm text-gray-700"></td>
                  <td className="px-4 py-4">
                    <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                      <option>This year</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a href="#" className="text-sm text-[#D4AF37] hover:underline">
                        Preview
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
