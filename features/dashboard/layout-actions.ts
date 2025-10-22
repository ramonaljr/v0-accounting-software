/**
 * Dashboard Layout Persistence Actions
 * Server actions for saving and loading dashboard layouts
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { DashboardLayout, WidgetConfig } from './types';
import { revalidatePath } from 'next/cache';

/**
 * Get user's dashboard layout
 * Falls back to org preset if user has no custom layout
 */
export async function getUserDashboardLayout(): Promise<{
  success: boolean;
  data?: DashboardLayout;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's org_id from org_members
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return { success: false, error: 'Organization not found' };
    }

    // Try to get user's custom layout first
    const { data: userLayout, error: userLayoutError } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .eq('user_id', user.id)
      .single();

    if (userLayout && !userLayoutError) {
      return {
        success: true,
        data: {
          userId: userLayout.user_id,
          orgId: userLayout.org_id,
          widgets: userLayout.widgets as WidgetConfig[],
          updatedAt: userLayout.updated_at,
        },
      };
    }

    // Fall back to org preset if user has no custom layout
    const { data: orgLayout, error: orgLayoutError } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .is('user_id', null)
      .single();

    if (orgLayout && !orgLayoutError) {
      return {
        success: true,
        data: {
          userId: undefined,
          orgId: orgLayout.org_id,
          widgets: orgLayout.widgets as WidgetConfig[],
          updatedAt: orgLayout.updated_at,
        },
      };
    }

    // No layout found - return default
    return {
      success: true,
      data: undefined, // Will use client-side default
    };
  } catch (error) {
    console.error('Error loading dashboard layout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load layout',
    };
  }
}

/**
 * Save user's dashboard layout
 */
export async function saveDashboardLayout(
  widgets: WidgetConfig[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's org_id
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return { success: false, error: 'Organization not found' };
    }

    // Upsert layout
    const { error: upsertError } = await supabase
      .from('dashboard_layouts')
      .upsert({
        org_id: orgMember.org_id,
        user_id: user.id,
        widgets,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,user_id',
      });

    if (upsertError) {
      console.error('Error saving dashboard layout:', upsertError);
      return { success: false, error: 'Failed to save layout' };
    }

    // Revalidate dashboard page
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save layout',
    };
  }
}

/**
 * Reset user's layout to org default
 */
export async function resetDashboardLayout(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's org_id
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return { success: false, error: 'Organization not found' };
    }

    // Delete user's custom layout
    const { error: deleteError } = await supabase
      .from('dashboard_layouts')
      .delete()
      .eq('org_id', orgMember.org_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error resetting dashboard layout:', deleteError);
      return { success: false, error: 'Failed to reset layout' };
    }

    // Revalidate dashboard page
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error resetting dashboard layout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset layout',
    };
  }
}

/**
 * Get org preset layout (admin only)
 */
export async function getOrgPresetLayout(): Promise<{
  success: boolean;
  data?: DashboardLayout;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's org_id and role
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if user is admin or owner
    if (orgMember.role !== 'admin' && orgMember.role !== 'owner') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get org preset
    const { data: orgLayout, error: orgLayoutError } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .is('user_id', null)
      .single();

    if (orgLayoutError) {
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        userId: undefined,
        orgId: orgLayout.org_id,
        widgets: orgLayout.widgets as WidgetConfig[],
        updatedAt: orgLayout.updated_at,
      },
    };
  } catch (error) {
    console.error('Error loading org preset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load preset',
    };
  }
}

/**
 * Save org preset layout (admin only)
 */
export async function saveOrgPresetLayout(
  widgets: WidgetConfig[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's org_id and role
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if user is admin or owner
    if (orgMember.role !== 'admin' && orgMember.role !== 'owner') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Upsert org preset
    const { error: upsertError } = await supabase
      .from('dashboard_layouts')
      .upsert({
        org_id: orgMember.org_id,
        user_id: null,
        widgets,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,user_id',
      });

    if (upsertError) {
      console.error('Error saving org preset:', upsertError);
      return { success: false, error: 'Failed to save preset' };
    }

    // Revalidate dashboard page
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error saving org preset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save preset',
    };
  }
}
