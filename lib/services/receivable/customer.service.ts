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
      .from('customers')
      .insert({
        org_id: input.orgId,
        customer_name: input.customerName,
        customer_type: input.customerType || 'Company',
        tin_number: input.tinNumber,
        tax_category: input.taxCategory || 'VAT Registered',
        is_subject_to_wht: input.isSubjectToWht || false,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        website: input.website,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        currency: input.currency || 'PHP',
        default_receivable_account: input.defaultReceivableAccount,
        payment_terms: input.paymentTerms,
        credit_limit: input.creditLimit || 0,
        credit_days: input.creditDays || 0,
        default_income_account: input.defaultIncomeAccount,
        default_cost_center: input.defaultCostCenter,
        customer_group: input.customerGroup,
        territory: input.territory,
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

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.customerType) {
      query = query.eq('customer_type', filters.customerType);
    }

    if (filters.customerGroup) {
      query = query.eq('customer_group', filters.customerGroup);
    }

    if (filters.taxCategory) {
      query = query.eq('tax_category', filters.taxCategory);
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

    const updateData: any = {};

    if (input.customerName !== undefined) updateData.customer_name = input.customerName;
    if (input.customerType !== undefined) updateData.customer_type = input.customerType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.tinNumber !== undefined) updateData.tin_number = input.tinNumber;
    if (input.taxCategory !== undefined) updateData.tax_category = input.taxCategory;
    if (input.isSubjectToWht !== undefined) updateData.is_subject_to_wht = input.isSubjectToWht;
    if (input.contactPerson !== undefined) updateData.contact_person = input.contactPerson;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.defaultReceivableAccount !== undefined) {
      updateData.default_receivable_account = input.defaultReceivableAccount;
    }
    if (input.paymentTerms !== undefined) updateData.payment_terms = input.paymentTerms;
    if (input.creditLimit !== undefined) updateData.credit_limit = input.creditLimit;
    if (input.creditDays !== undefined) updateData.credit_days = input.creditDays;
    if (input.defaultIncomeAccount !== undefined) {
      updateData.default_income_account = input.defaultIncomeAccount;
    }
    if (input.defaultCostCenter !== undefined) updateData.default_cost_center = input.defaultCostCenter;
    if (input.customerGroup !== undefined) updateData.customer_group = input.customerGroup;
    if (input.territory !== undefined) updateData.territory = input.territory;
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
   * Delete customer (soft delete by setting status to Inactive)
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

    // Get advance amount (negative outstanding in payment ledger)
    const { data: advances, error: advError } = await supabase
      .from('payment_ledger_entries')
      .select('amount')
      .eq('party_type', 'Customer')
      .eq('party_id', id)
      .lt('amount', 0);

    if (advError) {
      console.error('Failed to get customer advances:', advError);
    }

    const advanceAmount = (advances || []).reduce(
      (sum, entry) => sum + Math.abs(parseFloat(entry.amount)),
      0
    );

    return {
      ...customer,
      outstandingAmount: outstanding || 0,
      advanceAmount,
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
    const advanceByCustomer = new Map<string, number>();

    for (const entry of outstandingData || []) {
      const amount = parseFloat(entry.amount);
      const customerId = entry.party_id;

      if (amount >= 0) {
        outstandingByCustomer.set(
          customerId,
          (outstandingByCustomer.get(customerId) || 0) + amount
        );
      } else {
        advanceByCustomer.set(
          customerId,
          (advanceByCustomer.get(customerId) || 0) + Math.abs(amount)
        );
      }
    }

    return customers.map(customer => ({
      ...customer,
      outstandingAmount: outstandingByCustomer.get(customer.id) || 0,
      advanceAmount: advanceByCustomer.get(customer.id) || 0,
    }));
  }

  /**
   * Check credit limit
   */
  static async checkCreditLimit(
    customerId: string,
    additionalAmount: number
  ): Promise<{ allowed: boolean; creditLimit: number; outstanding: number; available: number }> {
    const customer = await this.getWithBalance(customerId);

    const available = customer.creditLimit - customer.outstandingAmount;
    const allowed = customer.creditLimit === 0 || // No credit limit set
      (customer.outstandingAmount + additionalAmount) <= customer.creditLimit;

    return {
      allowed,
      creditLimit: customer.creditLimit,
      outstanding: customer.outstandingAmount,
      available: Math.max(0, available),
    };
  }

  /**
   * Get customers by group
   */
  static async getByGroup(orgId: string, group: string): Promise<Customer[]> {
    return this.list({
      orgId,
      customerGroup: group,
      status: 'Active',
    });
  }

  /**
   * Map database row to Customer type
   */
  private static mapDbToCustomer(row: any): Customer {
    return {
      id: row.id,
      orgId: row.org_id,
      customerCode: row.customer_code,
      customerName: row.customer_name,
      customerType: row.customer_type,
      status: row.status,
      tinNumber: row.tin_number,
      taxCategory: row.tax_category,
      isSubjectToWht: row.is_subject_to_wht || false,
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
      defaultReceivableAccount: row.default_receivable_account,
      paymentTerms: row.payment_terms,
      creditLimit: parseFloat(row.credit_limit) || 0,
      creditDays: row.credit_days || 0,
      defaultIncomeAccount: row.default_income_account,
      defaultCostCenter: row.default_cost_center,
      customerGroup: row.customer_group,
      territory: row.territory,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }
}
