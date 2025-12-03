/**
 * Supplier Service
 * Manages supplier operations and AP tracking
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Supplier,
  CreateSupplier,
  UpdateSupplier,
  SupplierListFilters,
  SupplierWithBalance,
} from '@/lib/models/payable/supplier';
import { AccountingError } from '../accounting/ledger.service';

export class SupplierService {
  /**
   * Create a new supplier
   */
  static async create(input: CreateSupplier): Promise<Supplier> {
    const supabase = await createClient();

    // Build address objects
    const billingAddress = input.billingAddress
      ? {
          address_line1: input.billingAddress.addressLine1,
          address_line2: input.billingAddress.addressLine2,
          city: input.billingAddress.city,
          state_province: input.billingAddress.stateProvince,
          postal_code: input.billingAddress.postalCode,
          country: input.billingAddress.country,
          phone: input.billingAddress.phone,
          fax: input.billingAddress.fax,
          email: input.billingAddress.email,
        }
      : null;

    const shippingAddress = input.shippingAddress
      ? {
          address_line1: input.shippingAddress.addressLine1,
          address_line2: input.shippingAddress.addressLine2,
          city: input.shippingAddress.city,
          state_province: input.shippingAddress.stateProvince,
          postal_code: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
          phone: input.shippingAddress.phone,
          fax: input.shippingAddress.fax,
          email: input.shippingAddress.email,
        }
      : null;

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        org_id: input.orgId,
        supplier_name: input.supplierName,
        supplier_type: input.supplierType || 'Company',
        tin_number: input.tinNumber,
        tax_category: input.taxCategory || 'VAT Registered',
        is_wht_agent: input.isWhtAgent || false,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        website: input.website,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        currency: input.currency || 'PHP',
        default_payable_account: input.defaultPayableAccount,
        payment_terms: input.paymentTerms,
        credit_limit: input.creditLimit || 0,
        bank_name: input.bankName,
        bank_account_no: input.bankAccountNo,
        bank_account_name: input.bankAccountName,
        bank_branch: input.bankBranch,
        default_expense_account: input.defaultExpenseAccount,
        default_cost_center: input.defaultCostCenter,
        supplier_group: input.supplierGroup,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AccountingError('Supplier with this name already exists');
      }
      throw new AccountingError(`Failed to create supplier: ${error.message}`);
    }

    return this.mapDbToSupplier(data);
  }

  /**
   * Get supplier by ID
   */
  static async getById(id: string): Promise<Supplier> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AccountingError(`Supplier not found: ${id}`);
    }

    return this.mapDbToSupplier(data);
  }

  /**
   * Get supplier by code
   */
  static async getByCode(orgId: string, code: string): Promise<Supplier | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .eq('supplier_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AccountingError(`Failed to fetch supplier: ${error.message}`);
    }

    return this.mapDbToSupplier(data);
  }

  /**
   * List suppliers
   */
  static async list(filters: SupplierListFilters): Promise<Supplier[]> {
    const supabase = await createClient();

    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('supplier_name');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.supplierType) {
      query = query.eq('supplier_type', filters.supplierType);
    }

    if (filters.supplierGroup) {
      query = query.eq('supplier_group', filters.supplierGroup);
    }

    if (filters.taxCategory) {
      query = query.eq('tax_category', filters.taxCategory);
    }

    if (filters.search) {
      query = query.or(
        `supplier_name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to list suppliers: ${error.message}`);
    }

    return (data || []).map(this.mapDbToSupplier);
  }

  /**
   * Update supplier
   */
  static async update(input: UpdateSupplier): Promise<Supplier> {
    const supabase = await createClient();

    const updateData: any = {};

    if (input.supplierName !== undefined) updateData.supplier_name = input.supplierName;
    if (input.supplierType !== undefined) updateData.supplier_type = input.supplierType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.tinNumber !== undefined) updateData.tin_number = input.tinNumber;
    if (input.taxCategory !== undefined) updateData.tax_category = input.taxCategory;
    if (input.isWhtAgent !== undefined) updateData.is_wht_agent = input.isWhtAgent;
    if (input.contactPerson !== undefined) updateData.contact_person = input.contactPerson;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.defaultPayableAccount !== undefined) {
      updateData.default_payable_account = input.defaultPayableAccount;
    }
    if (input.paymentTerms !== undefined) updateData.payment_terms = input.paymentTerms;
    if (input.creditLimit !== undefined) updateData.credit_limit = input.creditLimit;
    if (input.bankName !== undefined) updateData.bank_name = input.bankName;
    if (input.bankAccountNo !== undefined) updateData.bank_account_no = input.bankAccountNo;
    if (input.bankAccountName !== undefined) updateData.bank_account_name = input.bankAccountName;
    if (input.bankBranch !== undefined) updateData.bank_branch = input.bankBranch;
    if (input.defaultExpenseAccount !== undefined) {
      updateData.default_expense_account = input.defaultExpenseAccount;
    }
    if (input.defaultCostCenter !== undefined) updateData.default_cost_center = input.defaultCostCenter;
    if (input.supplierGroup !== undefined) updateData.supplier_group = input.supplierGroup;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (input.billingAddress !== undefined) {
      updateData.billing_address = input.billingAddress
        ? {
            address_line1: input.billingAddress.addressLine1,
            address_line2: input.billingAddress.addressLine2,
            city: input.billingAddress.city,
            state_province: input.billingAddress.stateProvince,
            postal_code: input.billingAddress.postalCode,
            country: input.billingAddress.country,
            phone: input.billingAddress.phone,
            fax: input.billingAddress.fax,
            email: input.billingAddress.email,
          }
        : null;
    }

    if (input.shippingAddress !== undefined) {
      updateData.shipping_address = input.shippingAddress
        ? {
            address_line1: input.shippingAddress.addressLine1,
            address_line2: input.shippingAddress.addressLine2,
            city: input.shippingAddress.city,
            state_province: input.shippingAddress.stateProvince,
            postal_code: input.shippingAddress.postalCode,
            country: input.shippingAddress.country,
            phone: input.shippingAddress.phone,
            fax: input.shippingAddress.fax,
            email: input.shippingAddress.email,
          }
        : null;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new AccountingError(`Failed to update supplier: ${error.message}`);
    }

    return this.mapDbToSupplier(data);
  }

  /**
   * Delete supplier (soft delete by setting status to Inactive)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    // Check for existing invoices
    const { data: invoices } = await supabase
      .from('purchase_invoices')
      .select('id')
      .eq('supplier_id', id)
      .limit(1);

    if (invoices && invoices.length > 0) {
      throw new AccountingError(
        'Cannot delete supplier with existing invoices. Set to Inactive instead.'
      );
    }

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete supplier: ${error.message}`);
    }
  }

  /**
   * Get supplier with outstanding balance
   */
  static async getWithBalance(id: string): Promise<SupplierWithBalance> {
    const supabase = await createClient();

    const supplier = await this.getById(id);

    // Get outstanding amount from payment ledger
    const { data: outstanding, error: outError } = await supabase
      .rpc('get_supplier_outstanding', { p_supplier_id: id });

    if (outError) {
      console.error('Failed to get supplier outstanding:', outError);
    }

    // Get advance amount (negative outstanding - we've paid in advance)
    const { data: advances, error: advError } = await supabase
      .from('payment_ledger_entries')
      .select('amount')
      .eq('party_type', 'Supplier')
      .eq('party_id', id)
      .lt('amount', 0);

    if (advError) {
      console.error('Failed to get supplier advances:', advError);
    }

    const advanceAmount = (advances || []).reduce(
      (sum, entry) => sum + Math.abs(parseFloat(entry.amount)),
      0
    );

    return {
      ...supplier,
      outstandingAmount: outstanding || 0,
      advanceAmount,
    };
  }

  /**
   * List suppliers with balances
   */
  static async listWithBalances(filters: SupplierListFilters): Promise<SupplierWithBalance[]> {
    const supabase = await createClient();

    const suppliers = await this.list(filters);

    // Get all outstanding amounts in one query
    const supplierIds = suppliers.map(s => s.id);

    const { data: outstandingData } = await supabase
      .from('payment_ledger_entries')
      .select('party_id, amount')
      .eq('party_type', 'Supplier')
      .in('party_id', supplierIds);

    // Calculate outstanding by supplier
    const outstandingBySupplier = new Map<string, number>();
    const advanceBySupplier = new Map<string, number>();

    for (const entry of outstandingData || []) {
      const amount = parseFloat(entry.amount);
      const supplierId = entry.party_id;

      if (amount >= 0) {
        outstandingBySupplier.set(
          supplierId,
          (outstandingBySupplier.get(supplierId) || 0) + amount
        );
      } else {
        advanceBySupplier.set(
          supplierId,
          (advanceBySupplier.get(supplierId) || 0) + Math.abs(amount)
        );
      }
    }

    return suppliers.map(supplier => ({
      ...supplier,
      outstandingAmount: outstandingBySupplier.get(supplier.id) || 0,
      advanceAmount: advanceBySupplier.get(supplier.id) || 0,
    }));
  }

  /**
   * Get suppliers by group
   */
  static async getByGroup(orgId: string, group: string): Promise<Supplier[]> {
    return this.list({
      orgId,
      supplierGroup: group,
      status: 'Active',
    });
  }

  /**
   * Map database row to Supplier type
   */
  private static mapDbToSupplier(row: any): Supplier {
    return {
      id: row.id,
      orgId: row.org_id,
      supplierCode: row.supplier_code,
      supplierName: row.supplier_name,
      supplierType: row.supplier_type,
      status: row.status,
      tinNumber: row.tin_number,
      taxCategory: row.tax_category,
      isWhtAgent: row.is_wht_agent || false,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      website: row.website,
      billingAddress: row.billing_address
        ? {
            addressLine1: row.billing_address.address_line1,
            addressLine2: row.billing_address.address_line2,
            city: row.billing_address.city,
            stateProvince: row.billing_address.state_province,
            postalCode: row.billing_address.postal_code,
            country: row.billing_address.country,
            phone: row.billing_address.phone,
            fax: row.billing_address.fax,
            email: row.billing_address.email,
          }
        : undefined,
      shippingAddress: row.shipping_address
        ? {
            addressLine1: row.shipping_address.address_line1,
            addressLine2: row.shipping_address.address_line2,
            city: row.shipping_address.city,
            stateProvince: row.shipping_address.state_province,
            postalCode: row.shipping_address.postal_code,
            country: row.shipping_address.country,
            phone: row.shipping_address.phone,
            fax: row.shipping_address.fax,
            email: row.shipping_address.email,
          }
        : undefined,
      currency: row.currency || 'PHP',
      defaultPayableAccount: row.default_payable_account,
      paymentTerms: row.payment_terms,
      creditLimit: parseFloat(row.credit_limit) || 0,
      bankName: row.bank_name,
      bankAccountNo: row.bank_account_no,
      bankAccountName: row.bank_account_name,
      bankBranch: row.bank_branch,
      defaultExpenseAccount: row.default_expense_account,
      defaultCostCenter: row.default_cost_center,
      supplierGroup: row.supplier_group,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }
}
