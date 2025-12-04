'use client'

import { ChevronDown, ChevronRight, Star, MoreVertical, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportCategory } from './types'

interface StandardReportsProps {
  categories: ReportCategory[]
  expandedCategories: string[]
  onToggleCategory: (categoryName: string) => void
}

export function StandardReports({
  categories,
  expandedCategories,
  onToggleCategory,
}: StandardReportsProps) {
  return (
    <>
      {/* AI Summary Banner */}
      <div className="mx-6 mt-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            I generated a financial summary for September to give you key insights into your
            finances.{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Review Summary
            </a>
          </p>
        </div>
      </div>

      {/* Reports Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {categories.map(category => (
          <div
            key={category.name}
            className="mb-6 border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => onToggleCategory(category.name)}
              className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
            >
              {expandedCategories.includes(category.name) ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
              <span className="font-semibold text-gray-900">{category.name}</span>
            </button>

            {/* Category Reports */}
            {expandedCategories.includes(category.name) && (
              <div className="border-t border-gray-200">
                {category.name === 'Custom report builder' ? (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      {category.reports[0].name}{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Create new report
                      </a>
                    </p>
                    {category.reports.slice(1).map((report, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4"
                      >
                        <span className="text-sm text-gray-700">{report.name}</span>
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Star className="h-5 w-5 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {category.reports.map((report, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {report.hasIcon && (
                            <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm text-gray-700">{report.name}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Star
                              className={cn(
                                'h-5 w-5',
                                report.isFavorite
                                  ? 'text-green-600 fill-green-600'
                                  : 'text-gray-400'
                              )}
                            />
                          </button>
                          {report.hasIcon !== undefined && (
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-5 w-5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
