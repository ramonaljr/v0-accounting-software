/**
 * Vendor Management Server Actions
 * CRUD operations for vendors with RLS enforcement
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const VendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  defaultAccountId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

// =====================================================
// CREATE VENDOR
// =====================================================

export async function createVendor(input: z.infer<typeof VendorSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization and verify permissions
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    if (!["owner", "admin", "accountant", "staff"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validation = VendorSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Create vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        org_id: membership.org_id,
        name: data.name,
        display_name: data.displayName || data.name,
        email: data.email || null,
        phone: data.phone,
        address: data.address || null,
        tax_id: data.taxId,
        payment_terms: data.paymentTerms,
        default_account_id: data.defaultAccountId,
        is_active: data.isActive,
      })
      .select()
      .single();

    if (vendorError || !vendor) {
      console.error("[Vendor] Creation error:", vendorError);
      return { success: false, error: "Failed to create vendor" };
    }

    revalidatePath("/vendors");

    return {
      success: true,
      vendorId: vendor.id,
      message: "Vendor created successfully",
    };
  } catch (error) {
    console.error("[Vendor] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// UPDATE VENDOR
// =====================================================

export async function updateVendor(vendorId: string, input: Partial<z.infer<typeof VendorSchema>>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization and verify permissions
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    if (!["owner", "admin", "accountant", "staff"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Partial validation
    const validation = VendorSchema.partial().safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Update vendor
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        ...(data.name && { name: data.name }),
        ...(data.displayName && { display_name: data.displayName }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address && { address: data.address }),
        ...(data.taxId !== undefined && { tax_id: data.taxId }),
        ...(data.paymentTerms !== undefined && { payment_terms: data.paymentTerms }),
        ...(data.defaultAccountId !== undefined && { default_account_id: data.defaultAccountId }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Vendor] Update error:", updateError);
      return { success: false, error: "Failed to update vendor" };
    }

    revalidatePath("/vendors");

    return {
      success: true,
      message: "Vendor updated successfully",
    };
  } catch (error) {
    console.error("[Vendor] Update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET VENDORS
// =====================================================

export async function getVendors(filters?: { isActive?: boolean; search?: string }) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Build query
    let query = supabase
      .from("vendors")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("name", { ascending: true });

    // Apply filters
    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }
    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Vendors] Query error:", error);
      return { success: false, error: "Failed to fetch vendors" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Vendors] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// DELETE VENDOR (Archive)
// =====================================================

export async function deleteVendor(vendorId: string) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization and verify permissions
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return { success: false, error: "Only owners and admins can delete vendors" };
    }

    // Soft delete (deactivate) instead of hard delete
    const { error: updateError } = await supabase
      .from("vendors")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", vendorId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Vendor] Delete error:", updateError);
      return { success: false, error: "Failed to delete vendor" };
    }

    revalidatePath("/vendors");

    return {
      success: true,
      message: "Vendor archived successfully",
    };
  } catch (error) {
    console.error("[Vendor] Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
