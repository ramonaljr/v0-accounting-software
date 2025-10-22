'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgRole } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/database.types'

type OrgMemberRole = Database['public']['Tables']['org_members']['Row']['role']

interface InviteMemberParams {
  orgId: string
  email: string
  role: OrgMemberRole
}

export async function inviteMember(params: InviteMemberParams) {
  try {
    // Ensure user has admin or owner role
    const user = await requireOrgRole(params.orgId, 'admin')

    const supabase = await createClient()

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('org_members')
      .select('id, user_id, profiles!inner(email)')
      .eq('org_id', params.orgId)
      .eq('profiles.email', params.email)
      .single()

    if (existingMember) {
      return { error: 'User is already a member of this organization' }
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('org_id', params.orgId)
      .eq('email', params.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return { error: 'An invitation has already been sent to this email' }
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        org_id: params.orgId,
        email: params.email,
        role: params.role,
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError) {
      return { error: inviteError.message }
    }

    // TODO: Send invitation email
    // This would be implemented in Phase 5 with email service integration

    // Log audit event
    await logAuditEvent({
      orgId: params.orgId,
      userId: user.id,
      action: 'member.invite',
      entityType: 'invitation',
      entityId: invitation.id,
      metadata: {
        invitedEmail: params.email,
        role: params.role,
      },
    })

    revalidatePath(`/org/${params.orgId}/settings/team`)

    return { data: invitation }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}
