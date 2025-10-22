/**
 * Customer Management Server Actions
 * CRUD operations for customers with RLS enforcement
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

const CustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  billingAddress: AddressSchema.optional(),
  shippingAddress: AddressSchema.optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

// =====================================================
// CREATE CUSTOMER
// =====================================================

export async function createCustomer(input: z.infer<typeof CustomerSchema>) {
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
    const validation = CustomerSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        org_id: membership.org_id,
        name: data.name,
        display_name: data.displayName || data.name,
        email: data.email || null,
        phone: data.phone,
        billing_address: data.billingAddress || null,
        shipping_address: data.shippingAddress || null,
        tax_id: data.taxId,
        payment_terms: data.paymentTerms,
        credit_limit: data.creditLimit,
        is_active: data.isActive,
      })
      .select()
      .single();

    if (customerError || !customer) {
      console.error("[Customer] Creation error:", customerError);
      return { success: false, error: "Failed to create customer" };
    }

    revalidatePath("/customers");

    return {
      success: true,
      customerId: customer.id,
      message: "Customer created successfully",
    };
  } catch (error) {
    console.error("[Customer] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// UPDATE CUSTOMER
// =====================================================

export async function updateCustomer(customerId: string, input: Partial<z.infer<typeof CustomerSchema>>) {
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
    const validation = CustomerSchema.partial().safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Update customer
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        ...(data.name && { name: data.name }),
        ...(data.displayName && { display_name: data.displayName }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.billingAddress && { billing_address: data.billingAddress }),
        ...(data.shippingAddress && { shipping_address: data.shippingAddress }),
        ...(data.taxId !== undefined && { tax_id: data.taxId }),
        ...(data.paymentTerms !== undefined && { payment_terms: data.paymentTerms }),
        ...(data.creditLimit !== undefined && { credit_limit: data.creditLimit }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Customer] Update error:", updateError);
      return { success: false, error: "Failed to update customer" };
    }

    revalidatePath("/customers");

    return {
      success: true,
      message: "Customer updated successfully",
    };
  } catch (error) {
    console.error("[Customer] Update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET CUSTOMERS
// =====================================================

export async function getCustomers(filters?: { isActive?: boolean; search?: string }) {
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
      .from("customers")
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
      console.error("[Customers] Query error:", error);
      return { success: false, error: "Failed to fetch customers" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Customers] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// DELETE CUSTOMER (Archive)
// =====================================================

export async function deleteCustomer(customerId: string) {
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
      return { success: false, error: "Only owners and admins can delete customers" };
    }

    // Soft delete (deactivate) instead of hard delete
    const { error: updateError } = await supabase
      .from("customers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", customerId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Customer] Delete error:", updateError);
      return { success: false, error: "Failed to delete customer" };
    }

    revalidatePath("/customers");

    return {
      success: true,
      message: "Customer archived successfully",
    };
  } catch (error) {
    console.error("[Customer] Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
