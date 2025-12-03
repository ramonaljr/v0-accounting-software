'use client'

/**
 * ERPNext Health Dashboard Component
 * Displays sync status, errors, and connectivity
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'

interface HealthData {
  configured: boolean
  connectivity?: {
    connected: boolean
    user: string | null
    error: string | null
  }
  syncStats?: {
    total: number
    synced: number
    pending: number
    error: number
    conflict: number
  }
  entityStats?: Record<string, { total: number; synced: number; error: number }>
  recentErrors?: Array<{
    id: string
    entity_type: string
    erp_doctype: string
    error_message: string
    created_at: string
  }>
  performance?: {
    avgSyncDurationMs: number | null
    sampleSize: number
  }
}

export function ERPNextHealthDashboard({ orgId }: { orgId: string }) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/integrations/erpnext/health?orgId=${orgId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch health status')
      }

      const data = await response.json()
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading health status...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!health || !health.configured) {
    return null
  }

  const { connectivity, syncStats, entityStats, recentErrors, performance } = health

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sync Status</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHealth(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connectivity Status */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {connectivity?.connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {connectivity?.connected ? 'Connected to ERPNext' : 'Connection Failed'}
              </p>
              {connectivity?.user && (
                <p className="text-sm text-muted-foreground">Logged in as: {connectivity.user}</p>
              )}
              {connectivity?.error && (
                <p className="text-sm text-red-600">{connectivity.error}</p>
              )}
            </div>
          </div>
          {connectivity?.connected && (
            <Badge variant="default" className="bg-green-600">Online</Badge>
          )}
          {!connectivity?.connected && (
            <Badge variant="destructive">Offline</Badge>
          )}
        </div>
      </div>

      {/* Sync Statistics */}
      {syncStats && syncStats.total > 0 && (
        <div>
          <h4 className="font-medium mb-3">Sync Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              label="Total"
              value={syncStats.total}
              icon={<Clock className="h-4 w-4" />}
              variant="default"
            />
            <StatCard
              label="Synced"
              value={syncStats.synced}
              icon={<CheckCircle2 className="h-4 w-4" />}
              variant="success"
            />
            <StatCard
              label="Pending"
              value={syncStats.pending}
              icon={<Clock className="h-4 w-4" />}
              variant="warning"
            />
            <StatCard
              label="Errors"
              value={syncStats.error}
              icon={<XCircle className="h-4 w-4" />}
              variant="error"
            />
            <StatCard
              label="Conflicts"
              value={syncStats.conflict}
              icon={<AlertCircle className="h-4 w-4" />}
              variant="warning"
            />
          </div>
        </div>
      )}

      {/* Entity Breakdown */}
      {entityStats && Object.keys(entityStats).length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Entity Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(entityStats).map(([entityType, stats]) => (
              <div key={entityType} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <p className="font-medium capitalize">{entityType.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {stats.synced}/{stats.total} synced
                    </span>
                    {stats.error > 0 && (
                      <span className="text-sm text-red-600">
                        {stats.error} errors
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${(stats.synced / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance */}
      {performance && performance.avgSyncDurationMs !== null && (
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Performance</h4>
          <p className="text-sm text-muted-foreground">
            Average sync duration: <span className="font-medium text-foreground">
              {performance.avgSyncDurationMs}ms
            </span>
            {' '}(based on {performance.sampleSize} recent syncs)
          </p>
        </div>
      )}

      {/* Recent Errors */}
      {recentErrors && recentErrors.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Recent Errors</h4>
          <div className="space-y-2">
            {recentErrors.slice(0, 5).map((errorEvent) => (
              <Alert key={errorEvent.id} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">
                    {errorEvent.entity_type} - {errorEvent.erp_doctype}
                  </p>
                  <p className="text-sm mt-1">{errorEvent.error_message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(errorEvent.created_at).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string
  value: number
  icon: React.ReactNode
  variant: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantStyles = {
    default: 'border-gray-200 bg-gray-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  }

  const iconStyles = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }

  return (
    <div className={`p-4 border rounded-lg ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={iconStyles[variant]}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
