/**
 * Customer Service
 * Manages customer operations and AR tracking
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerListFilters,
  CustomerWithBalance,
} from '@/lib/models/receivable/customer';
import { AccountingError } from '../accounting/ledger.service';

export class CustomerService {
  /**
   * Create a new customer
   */
  static async create(input: CreateCustomer): Promise<Customer> {
    const supabase = await createClient();

    // Build address objects from flat fields
    const billingAddress = input.billingAddressLine1
      ? {
          line1: input.billingAddressLine1,
          line2: input.billingAddressLine2,
          city: input.billingCity,
          state: input.billingState,
          postal_code: input.billingPostalCode,
          country: input.billingCountry,
        }
      : null;

    const shippingAddress = input.shippingAddressLine1
      ? {
          line1: input.shippingAddressLine1,
          line2: input.shippingAddressLine2,
          city: input.shippingCity,
          state: input.shippingState,
          postal_code: input.shippingPostalCode,
          country: input.shippingCountry,
        }
      : null;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        org_id: input.orgId,
        customer_code: input.customerCode,
        customer_name: input.customerName,
        customer_type: input.customerType || 'Company',
        tax_id: input.taxId,
        tax_category: input.taxCategory,
        primary_contact_name: input.primaryContactName,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        website: input.website,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        default_currency: input.defaultCurrency || 'PHP',
        credit_limit: input.creditLimit || 0,
        payment_terms: input.paymentTerms || 30,
        price_list_id: input.priceListId,
        default_receivable_account_id: input.defaultReceivableAccountId,
        customer_group: input.customerGroup,
        territory: input.territory,
        industry: input.industry,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AccountingError('Customer with this name already exists');
      }
      throw new AccountingError(`Failed to create customer: ${error.message}`);
    }

    return this.mapDbToCustomer(data);
  }

  /**
   * Get customer by ID
   */
  static async getById(id: string): Promise<Customer> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AccountingError(`Customer not found: ${id}`);
    }

    return this.mapDbToCustomer(data);
  }

  /**
   * Get customer by code
   */
  static async getByCode(orgId: string, code: string): Promise<Customer | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('org_id', orgId)
      .eq('customer_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AccountingError(`Failed to fetch customer: ${error.message}`);
    }

    return this.mapDbToCustomer(data);
  }

  /**
   * List customers
   */
  static async list(filters: CustomerListFilters): Promise<Customer[]> {
    const supabase = await createClient();

    let query = supabase
      .from('customers')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('customer_name');

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.customerGroup) {
      query = query.eq('customer_group', filters.customerGroup);
    }

    if (filters.territory) {
      query = query.eq('territory', filters.territory);
    }

    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
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
      throw new AccountingError(`Failed to list customers: ${error.message}`);
    }

    return (data || []).map(this.mapDbToCustomer);
  }

  /**
   * Update customer
   */
  static async update(input: UpdateCustomer): Promise<Customer> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (input.customerCode !== undefined) updateData.customer_code = input.customerCode;
    if (input.customerName !== undefined) updateData.customer_name = input.customerName;
    if (input.customerType !== undefined) updateData.customer_type = input.customerType;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.isFrozen !== undefined) updateData.is_frozen = input.isFrozen;
    if (input.taxId !== undefined) updateData.tax_id = input.taxId;
    if (input.taxCategory !== undefined) updateData.tax_category = input.taxCategory;
    if (input.primaryContactName !== undefined) updateData.primary_contact_name = input.primaryContactName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.defaultCurrency !== undefined) updateData.default_currency = input.defaultCurrency;
    if (input.creditLimit !== undefined) updateData.credit_limit = input.creditLimit;
    if (input.paymentTerms !== undefined) updateData.payment_terms = input.paymentTerms;
    if (input.priceListId !== undefined) updateData.price_list_id = input.priceListId;
    if (input.defaultReceivableAccountId !== undefined) {
      updateData.default_receivable_account_id = input.defaultReceivableAccountId;
    }
    if (input.customerGroup !== undefined) updateData.customer_group = input.customerGroup;
    if (input.territory !== undefined) updateData.territory = input.territory;
    if (input.industry !== undefined) updateData.industry = input.industry;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Handle billing address fields
    if (
      input.billingAddressLine1 !== undefined ||
      input.billingAddressLine2 !== undefined ||
      input.billingCity !== undefined ||
      input.billingState !== undefined ||
      input.billingPostalCode !== undefined ||
      input.billingCountry !== undefined
    ) {
      updateData.billing_address = {
        line1: input.billingAddressLine1,
        line2: input.billingAddressLine2,
        city: input.billingCity,
        state: input.billingState,
        postal_code: input.billingPostalCode,
        country: input.billingCountry,
      };
    }

    // Handle shipping address fields
    if (
      input.shippingAddressLine1 !== undefined ||
      input.shippingAddressLine2 !== undefined ||
      input.shippingCity !== undefined ||
      input.shippingState !== undefined ||
      input.shippingPostalCode !== undefined ||
      input.shippingCountry !== undefined
    ) {
      updateData.shipping_address = {
        line1: input.shippingAddressLine1,
        line2: input.shippingAddressLine2,
        city: input.shippingCity,
        state: input.shippingState,
        postal_code: input.shippingPostalCode,
        country: input.shippingCountry,
      };
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new AccountingError(`Failed to update customer: ${error.message}`);
    }

    return this.mapDbToCustomer(data);
  }

  /**
   * Delete customer (soft delete by setting isActive to false)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    // Check for existing invoices
    const { data: invoices } = await supabase
      .from('sales_invoices')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if (invoices && invoices.length > 0) {
      throw new AccountingError(
        'Cannot delete customer with existing invoices. Set to Inactive instead.'
      );
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get customer with outstanding balance
   */
  static async getWithBalance(id: string): Promise<CustomerWithBalance> {
    const supabase = await createClient();

    const customer = await this.getById(id);

    // Get outstanding amount from payment ledger
    const { data: outstanding, error: outError } = await supabase
      .rpc('get_customer_outstanding', { p_customer_id: id });

    if (outError) {
      console.error('Failed to get customer outstanding:', outError);
    }

    const outstandingBalance = outstanding || 0;
    const creditAvailable = Math.max(0, customer.creditLimit - outstandingBalance);

    return {
      ...customer,
      outstandingBalance,
      creditAvailable,
    };
  }

  /**
   * List customers with balances
   */
  static async listWithBalances(filters: CustomerListFilters): Promise<CustomerWithBalance[]> {
    const supabase = await createClient();

    const customers = await this.list(filters);

    // Get all outstanding amounts in one query
    const customerIds = customers.map(c => c.id);

    const { data: outstandingData } = await supabase
      .from('payment_ledger_entries')
      .select('party_id, amount')
      .eq('party_type', 'Customer')
      .in('party_id', customerIds);

    // Calculate outstanding by customer
    const outstandingByCustomer = new Map<string, number>();

    for (const entry of outstandingData || []) {
      const amount = parseFloat(entry.amount);
      const customerId = entry.party_id;

      if (amount >= 0) {
        outstandingByCustomer.set(
          customerId,
          (outstandingByCustomer.get(customerId) || 0) + amount
        );
      }
    }

    return customers.map(customer => {
      const outstandingBalance = outstandingByCustomer.get(customer.id) || 0;
      return {
        ...customer,
        outstandingBalance,
        creditAvailable: Math.max(0, customer.creditLimit - outstandingBalance),
      };
    });
  }

  /**
   * Check credit limit
   */
  static async checkCreditLimit(
    customerId: string,
    additionalAmount: number
  ): Promise<{ allowed: boolean; creditLimit: number; outstanding: number; available: number }> {
    const customer = await this.getWithBalance(customerId);

    const available = customer.creditAvailable;
    const allowed = customer.creditLimit === 0 || // No credit limit set
      additionalAmount <= available;

    return {
      allowed,
      creditLimit: customer.creditLimit,
      outstanding: customer.outstandingBalance,
      available,
    };
  }

  /**
   * Get customers by group
   */
  static async getByGroup(orgId: string, group: string): Promise<Customer[]> {
    return this.list({
      orgId,
      customerGroup: group,
      isActive: true,
    });
  }

  /**
   * Map database row to Customer type
   */
  private static mapDbToCustomer(row: Record<string, unknown>): Customer {
    const billingAddr = row.billing_address as Record<string, unknown> | null;
    const shippingAddr = row.shipping_address as Record<string, unknown> | null;

    return {
      id: row.id as string,
      orgId: row.org_id as string,
      customerCode: row.customer_code as string,
      customerName: row.customer_name as string,
      customerType: (row.customer_type as 'Company' | 'Individual') || 'Company',
      taxId: row.tax_id as string | undefined,
      taxCategory: row.tax_category as 'VAT Registered' | 'Non-VAT' | 'VAT Exempt' | 'Zero Rated' | 'Government' | undefined,
      primaryContactName: row.primary_contact_name as string | undefined,
      email: row.email as string | undefined,
      phone: row.phone as string | undefined,
      mobile: row.mobile as string | undefined,
      website: row.website as string | undefined,
      billingAddress: billingAddr
        ? {
            line1: billingAddr.line1 as string | undefined,
            line2: billingAddr.line2 as string | undefined,
            city: billingAddr.city as string | undefined,
            state: billingAddr.state as string | undefined,
            postalCode: billingAddr.postal_code as string | undefined,
            country: (billingAddr.country as string) || 'PH',
          }
        : undefined,
      shippingAddress: shippingAddr
        ? {
            line1: shippingAddr.line1 as string | undefined,
            line2: shippingAddr.line2 as string | undefined,
            city: shippingAddr.city as string | undefined,
            state: shippingAddr.state as string | undefined,
            postalCode: shippingAddr.postal_code as string | undefined,
            country: (shippingAddr.country as string) || 'PH',
          }
        : undefined,
      defaultCurrency: (row.default_currency as string) || 'PHP',
      creditLimit: parseFloat(row.credit_limit as string) || 0,
      paymentTerms: (row.payment_terms as number) || 30,
      priceListId: row.price_list_id as string | undefined,
      defaultReceivableAccountId: row.default_receivable_account_id as string | undefined,
      customerGroup: row.customer_group as string | undefined,
      territory: row.territory as string | undefined,
      industry: row.industry as string | undefined,
      isActive: row.is_active !== false,
      isFrozen: row.is_frozen === true,
      notes: row.notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
