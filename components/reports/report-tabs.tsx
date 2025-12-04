'use client'

import { cn } from '@/lib/utils'
import type { ReportTab } from './types'

interface ReportTabsProps {
  tabs: ReportTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function ReportTabs({ tabs, activeTab, onTabChange }: ReportTabsProps) {
  return (
    <div className="border-b border-gray-200 px-6">
      <div className="flex items-center gap-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative py-4 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge && <span className="inline-flex h-2 w-2 rounded-full bg-pink-500" />}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
