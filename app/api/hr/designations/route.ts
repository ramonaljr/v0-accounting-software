/**
 * Designations API
 * REST endpoints for designation management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const CreateDesignationSchema = z.object({
  designationName: z.string().min(1),
  description: z.string().optional(),
});

/**
 * GET /api/hr/designations
 * List designations
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: designations, error } = await supabase
      .from('designations')
      .select('*')
      .eq('org_id', membership.org_id)
      .eq('is_active', true)
      .order('designation_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: designations || [],
    });
  } catch (error) {
    console.error('[GET /api/hr/designations] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list designations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/designations
 * Create a new designation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateDesignationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { data: designation, error } = await supabase
      .from('designations')
      .insert({
        org_id: membership.org_id,
        designation_name: validated.data.designationName,
        description: validated.data.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: designation }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/designations] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create designation' },
      { status: 500 }
    );
  }
}
