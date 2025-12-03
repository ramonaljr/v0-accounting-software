/**
 * ERPNext Health Check API
 * Monitor sync status, errors, and connectivity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { whoAmI } from '@/lib/erpnext/client'
import { features } from '@/lib/env'

/**
 * GET /api/integrations/erpnext/health?orgId=xxx
 * Get ERPNext integration health status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing orgId query parameter' },
        { status: 400 }
      )
    }

    // Verify user has access to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if ERPNext is configured
    if (!features.hasERPNext) {
      return NextResponse.json({
        configured: false,
        message: 'ERPNext integration is not configured',
      })
    }

    // Test connectivity
    let connectivity = {
      connected: false,
      user: null as string | null,
      error: null as string | null,
    }

    try {
      const userInfo = await whoAmI()
      connectivity = {
        connected: true,
        user: userInfo.message || null,
        error: null,
      }
    } catch (error) {
      connectivity = {
        connected: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Get sync statistics
    const { data: stats } = await supabase
      .from('erp_map')
      .select('sync_status')
      .eq('org_id', orgId)

    const syncStats = {
      total: stats?.length || 0,
      synced: stats?.filter(s => s.sync_status === 'synced').length || 0,
      pending: stats?.filter(s => s.sync_status === 'pending').length || 0,
      error: stats?.filter(s => s.sync_status === 'error').length || 0,
      conflict: stats?.filter(s => s.sync_status === 'conflict').length || 0,
    }

    // Get recent errors
    const { data: recentErrors } = await supabase
      .from('sync_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get entity type breakdown
    const { data: entityBreakdown } = await supabase
      .from('erp_map')
      .select('entity_type, sync_status')
      .eq('org_id', orgId)

    const entityStats = entityBreakdown?.reduce((acc, item) => {
      if (!acc[item.entity_type]) {
        acc[item.entity_type] = { total: 0, synced: 0, error: 0 }
      }
      acc[item.entity_type].total++
      if (item.sync_status === 'synced') {
        acc[item.entity_type].synced++
      }
      if (item.sync_status === 'error') {
        acc[item.entity_type].error++
      }
      return acc
    }, {} as Record<string, { total: number; synced: number; error: number }>)

    // Get average sync duration
    const { data: durationData } = await supabase
      .from('sync_events')
      .select('duration_ms')
      .eq('org_id', orgId)
      .eq('status', 'success')
      .not('duration_ms', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    const avgDuration = durationData && durationData.length > 0
      ? durationData.reduce((sum, d) => sum + (d.duration_ms || 0), 0) / durationData.length
      : null

    return NextResponse.json({
      configured: true,
      connectivity,
      syncStats,
      entityStats: entityStats || {},
      recentErrors: recentErrors || [],
      performance: {
        avgSyncDurationMs: avgDuration ? Math.round(avgDuration) : null,
        sampleSize: durationData?.length || 0,
      },
    })
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Health check failed' },
      { status: 500 }
    )
  }
}
