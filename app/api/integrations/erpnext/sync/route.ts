/**
 * ERPNext Sync API
 * Handles manual and batch sync operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { pushToERPNext, pullFromERPNext, batchSync } from '@/lib/erpnext/sync'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const syncRequestSchema = z.object({
  orgId: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  erpDoctype: z.string(),
  direction: z.enum(['push', 'pull']),
  payload: z.any().optional(),
})

const batchSyncRequestSchema = z.object({
  entities: z.array(syncRequestSchema),
})

/**
 * POST /api/integrations/erpnext/sync
 * Sync a single entity or batch sync multiple entities
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Check if batch sync
    if (body.entities) {
      const validated = batchSyncRequestSchema.parse(body)

      // Verify user has access to all orgs
      for (const entity of validated.entities) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', entity.orgId)
          .eq('user_id', user.id)
          .single()

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json(
            { error: 'Forbidden: insufficient permissions' },
            { status: 403 }
          )
        }
      }

      const results = await batchSync(validated.entities)

      return NextResponse.json({
        success: true,
        results,
      })
    } else {
      // Single sync
      const validated = syncRequestSchema.parse(body)

      // Verify user has access to org
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', validated.orgId)
        .eq('user_id', user.id)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        )
      }

      let result

      if (validated.direction === 'push') {
        if (!validated.payload) {
          return NextResponse.json(
            { error: 'Payload required for push operations' },
            { status: 400 }
          )
        }

        result = await pushToERPNext(validated, validated.payload)
      } else {
        result = await pullFromERPNext(validated)
      }

      return NextResponse.json({
        success: result.success,
        result,
      })
    }
  } catch (error) {
    console.error('Sync error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/integrations/erpnext/sync?orgId=xxx&entityType=xxx&entityId=xxx
 * Get sync status for an entity
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
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!orgId || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
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

    // Get mapping
    const { data: mapping } = await supabase
      .from('erp_map')
      .select('*')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single()

    // Get recent sync events
    const { data: events } = await supabase
      .from('sync_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      mapping: mapping || null,
      recentEvents: events || [],
    })
  } catch (error) {
    console.error('Get sync status error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
