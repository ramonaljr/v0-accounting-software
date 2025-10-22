'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface LastRefreshedProps {
  timestamp?: Date | string
  className?: string
  showIcon?: boolean
}

/**
 * LastRefreshed component displays when data was last updated
 * Implements Nielsen's Visibility of System Status heuristic
 */
export function LastRefreshed({
  timestamp = new Date(),
  className = '',
  showIcon = true,
}: LastRefreshedProps) {
  const [relativeTime, setRelativeTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatRelativeTime(timestamp))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Last refreshed ${relativeTime}`}
    >
      {showIcon && <Clock className="h-3 w-3" aria-hidden="true" />}
      <span>Last refreshed {relativeTime}</span>
    </div>
  )
}
