/**
 * Salary Structure Service
 * Manages salary structures, components, and assignments
 * Based on ERPNext's salary structure functionality
 */

import { createClient } from '@/lib/supabase/server';
import { evaluateFormula } from '@/lib/utils/formula-parser';

// =============================================
// TYPES
// =============================================

export interface SalaryComponent {
  id: string;
  orgId: string;
  componentCode: string;
  componentName: string;
  componentType: 'Earning' | 'Deduction';
  description?: string;
  // Calculation settings
  isPayableBased?: boolean;
  dependsOnPaymentDays: boolean;
  isRecurring: boolean;
  isTaxApplicable: boolean;
  // Formula
  amountBasedOnFormula: boolean;
  formula?: string;
  defaultAmount: number;
  // PH Statutory flags
  isStatutory: boolean;
  statisticalComponent: boolean;
  doNotIncludeInTotal: boolean;
  // Display
  abbr: string;
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryStructure {
  id: string;
  orgId: string;
  structureName: string;
  description?: string;
  isActive: boolean;
  // Settings
  payrollFrequency: 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Bi-Weekly';
  modeOfPayment?: string;
  paymentAccount?: string;
  // Applicable to
  companyId?: string;
  currencyCode: string;
  // Metadata
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryStructureEarning {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  componentName?: string;
  componentCode?: string;
  abbr?: string;
  amountBasedOnFormula: boolean;
  formula?: string;
  amount: number;
  isTaxApplicable: boolean;
  dependsOnPaymentDays: boolean;
  idx: number;
}

export interface SalaryStructureDeduction {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  componentName?: string;
  componentCode?: string;
  abbr?: string;
  amountBasedOnFormula: boolean;
  formula?: string;
  amount: number;
  isStatutory: boolean;
  idx: number;
}

export interface SalaryStructureAssignment {
  id: string;
  orgId: string;
  employeeId: string;
  salaryStructureId: string;
  fromDate: Date;
  toDate?: Date;
  basePay: number;
  variablePayPercent?: number;
  incomeCategory?: string;
  // Status
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalaryComponent {
  orgId: string;
  componentCode: string;
  componentName: string;
  componentType: 'Earning' | 'Deduction';
  description?: string;
  isPayableBased?: boolean;
  dependsOnPaymentDays?: boolean;
  isRecurring?: boolean;
  isTaxApplicable?: boolean;
  amountBasedOnFormula?: boolean;
  formula?: string;
  defaultAmount?: number;
  isStatutory?: boolean;
  statisticalComponent?: boolean;
  doNotIncludeInTotal?: boolean;
  abbr?: string;
}

export interface CreateSalaryStructure {
  orgId: string;
  structureName: string;
  description?: string;
  payrollFrequency?: 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Bi-Weekly';
  modeOfPayment?: string;
  paymentAccount?: string;
  companyId?: string;
  currencyCode?: string;
  earnings?: Array<{
    salaryComponentId: string;
    amountBasedOnFormula?: boolean;
    formula?: string;
    amount?: number;
  }>;
  deductions?: Array<{
    salaryComponentId: string;
    amountBasedOnFormula?: boolean;
    formula?: string;
    amount?: number;
  }>;
}

export interface CreateSalaryStructureAssignment {
  orgId: string;
  employeeId: string;
  salaryStructureId: string;
  fromDate: Date;
  toDate?: Date;
  basePay: number;
  variablePayPercent?: number;
  incomeCategory?: string;
}

// =============================================
// SERVICE CLASS
// =============================================

export class SalaryStructureService {
  // ==================== SALARY COMPONENTS ====================

  /**
   * Create a salary component
   */
  static async createSalaryComponent(data: CreateSalaryComponent): Promise<SalaryComponent> {
    const supabase = await createClient();

    const { data: component, error } = await supabase
      .from('salary_components')
      .insert({
        org_id: data.orgId,
        component_code: data.componentCode,
        component_name: data.componentName,
        component_type: data.componentType,
        description: data.description,
        is_payable_based: data.isPayableBased ?? false,
        depends_on_payment_days: data.dependsOnPaymentDays ?? true,
        is_recurring: data.isRecurring ?? true,
        is_tax_applicable: data.isTaxApplicable ?? true,
        amount_based_on_formula: data.amountBasedOnFormula ?? false,
        formula: data.formula,
        default_amount: data.defaultAmount ?? 0,
        is_statutory: data.isStatutory ?? false,
        statistical_component: data.statisticalComponent ?? false,
        do_not_include_in_total: data.doNotIncludeInTotal ?? false,
        abbr: data.abbr || data.componentCode.substring(0, 5).toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create salary component: ${error.message}`);
    }

    return this.mapSalaryComponent(component);
  }

  /**
   * Get salary component by ID
   */
  static async getSalaryComponentById(id: string): Promise<SalaryComponent | null> {
    const supabase = await createClient();

    const { data: component, error } = await supabase
      .from('salary_components')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !component) {
      return null;
    }

    return this.mapSalaryComponent(component);
  }

  /**
   * List salary components
   */
  static async listSalaryComponents(
    orgId: string,
    componentType?: 'Earning' | 'Deduction'
  ): Promise<SalaryComponent[]> {
    const supabase = await createClient();

    let query = supabase
      .from('salary_components')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('component_name', { ascending: true });

    if (componentType) {
      query = query.eq('component_type', componentType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list salary components: ${error.message}`);
    }

    return (data || []).map(this.mapSalaryComponent);
  }

  /**
   * Update salary component
   */
  static async updateSalaryComponent(
    id: string,
    data: Partial<CreateSalaryComponent>
  ): Promise<SalaryComponent> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (data.componentName !== undefined) updateData.component_name = data.componentName;
    if (data.componentCode !== undefined) updateData.component_code = data.componentCode;
    if (data.componentType !== undefined) updateData.component_type = data.componentType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isPayableBased !== undefined) updateData.is_payable_based = data.isPayableBased;
    if (data.dependsOnPaymentDays !== undefined) updateData.depends_on_payment_days = data.dependsOnPaymentDays;
    if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
    if (data.isTaxApplicable !== undefined) updateData.is_tax_applicable = data.isTaxApplicable;
    if (data.amountBasedOnFormula !== undefined) updateData.amount_based_on_formula = data.amountBasedOnFormula;
    if (data.formula !== undefined) updateData.formula = data.formula;
    if (data.defaultAmount !== undefined) updateData.default_amount = data.defaultAmount;
    if (data.isStatutory !== undefined) updateData.is_statutory = data.isStatutory;
    if (data.statisticalComponent !== undefined) updateData.statistical_component = data.statisticalComponent;
    if (data.doNotIncludeInTotal !== undefined) updateData.do_not_include_in_total = data.doNotIncludeInTotal;
    if (data.abbr !== undefined) updateData.abbr = data.abbr;

    const { data: component, error } = await supabase
      .from('salary_components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update salary component: ${error.message}`);
    }

    return this.mapSalaryComponent(component);
  }

  // ==================== SALARY STRUCTURES ====================

  /**
   * Create a salary structure
   */
  static async createSalaryStructure(data: CreateSalaryStructure): Promise<SalaryStructure> {
    const supabase = await createClient();

    // Create the structure
    const { data: structure, error } = await supabase
      .from('salary_structures')
      .insert({
        org_id: data.orgId,
        structure_name: data.structureName,
        description: data.description,
        payroll_frequency: data.payrollFrequency || 'Monthly',
        mode_of_payment: data.modeOfPayment,
        payment_account: data.paymentAccount,
        company_id: data.companyId,
        currency_code: data.currencyCode || 'PHP',
        is_active: true,
        docstatus: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create salary structure: ${error.message}`);
    }

    // Add earnings if provided
    if (data.earnings && data.earnings.length > 0) {
      const earningsData = data.earnings.map((e, idx) => ({
        salary_structure_id: structure.id,
        salary_component_id: e.salaryComponentId,
        amount_based_on_formula: e.amountBasedOnFormula ?? false,
        formula: e.formula,
        amount: e.amount ?? 0,
        idx: idx + 1,
      }));

      const { error: earningsError } = await supabase
        .from('salary_structure_earnings')
        .insert(earningsData);

      if (earningsError) {
        console.error('Failed to add earnings:', earningsError);
      }
    }

    // Add deductions if provided
    if (data.deductions && data.deductions.length > 0) {
      const deductionsData = data.deductions.map((d, idx) => ({
        salary_structure_id: structure.id,
        salary_component_id: d.salaryComponentId,
        amount_based_on_formula: d.amountBasedOnFormula ?? false,
        formula: d.formula,
        amount: d.amount ?? 0,
        idx: idx + 1,
      }));

      const { error: deductionsError } = await supabase
        .from('salary_structure_deductions')
        .insert(deductionsData);

      if (deductionsError) {
        console.error('Failed to add deductions:', deductionsError);
      }
    }

    return this.mapSalaryStructure(structure);
  }

  /**
   * Get salary structure by ID with earnings and deductions
   */
  static async getSalaryStructureById(id: string): Promise<{
    structure: SalaryStructure;
    earnings: SalaryStructureEarning[];
    deductions: SalaryStructureDeduction[];
  } | null> {
    const supabase = await createClient();

    const { data: structure, error } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !structure) {
      return null;
    }

    // Get earnings
    const { data: earnings } = await supabase
      .from('salary_structure_earnings')
      .select(`
        *,
        salary_component:salary_components(component_name, component_code, abbr, is_tax_applicable, depends_on_payment_days)
      `)
      .eq('salary_structure_id', id)
      .order('idx', { ascending: true });

    // Get deductions
    const { data: deductions } = await supabase
      .from('salary_structure_deductions')
      .select(`
        *,
        salary_component:salary_components(component_name, component_code, abbr, is_statutory)
      `)
      .eq('salary_structure_id', id)
      .order('idx', { ascending: true });

    return {
      structure: this.mapSalaryStructure(structure),
      earnings: (earnings || []).map((e) => ({
        id: e.id,
        salaryStructureId: e.salary_structure_id,
        salaryComponentId: e.salary_component_id,
        componentName: e.salary_component?.component_name,
        componentCode: e.salary_component?.component_code,
        abbr: e.salary_component?.abbr,
        amountBasedOnFormula: e.amount_based_on_formula,
        formula: e.formula,
        amount: e.amount,
        isTaxApplicable: e.salary_component?.is_tax_applicable ?? true,
        dependsOnPaymentDays: e.salary_component?.depends_on_payment_days ?? true,
        idx: e.idx,
      })),
      deductions: (deductions || []).map((d) => ({
        id: d.id,
        salaryStructureId: d.salary_structure_id,
        salaryComponentId: d.salary_component_id,
        componentName: d.salary_component?.component_name,
        componentCode: d.salary_component?.component_code,
        abbr: d.salary_component?.abbr,
        amountBasedOnFormula: d.amount_based_on_formula,
        formula: d.formula,
        amount: d.amount,
        isStatutory: d.salary_component?.is_statutory ?? false,
        idx: d.idx,
      })),
    };
  }

  /**
   * List salary structures
   */
  static async listSalaryStructures(
    orgId: string,
    options?: { isActive?: boolean }
  ): Promise<SalaryStructure[]> {
    const supabase = await createClient();

    let query = supabase
      .from('salary_structures')
      .select('*')
      .eq('org_id', orgId)
      .order('structure_name', { ascending: true });

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list salary structures: ${error.message}`);
    }

    return (data || []).map(this.mapSalaryStructure);
  }

  /**
   * Add earnings to salary structure
   */
  static async addEarningToStructure(
    structureId: string,
    earning: {
      salaryComponentId: string;
      amountBasedOnFormula?: boolean;
      formula?: string;
      amount?: number;
    }
  ): Promise<SalaryStructureEarning> {
    const supabase = await createClient();

    // Get max idx
    const { data: maxIdxResult } = await supabase
      .from('salary_structure_earnings')
      .select('idx')
      .eq('salary_structure_id', structureId)
      .order('idx', { ascending: false })
      .limit(1);

    const nextIdx = (maxIdxResult?.[0]?.idx || 0) + 1;

    const { data, error } = await supabase
      .from('salary_structure_earnings')
      .insert({
        salary_structure_id: structureId,
        salary_component_id: earning.salaryComponentId,
        amount_based_on_formula: earning.amountBasedOnFormula ?? false,
        formula: earning.formula,
        amount: earning.amount ?? 0,
        idx: nextIdx,
      })
      .select(`
        *,
        salary_component:salary_components(component_name, component_code, abbr, is_tax_applicable, depends_on_payment_days)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add earning: ${error.message}`);
    }

    return {
      id: data.id,
      salaryStructureId: data.salary_structure_id,
      salaryComponentId: data.salary_component_id,
      componentName: data.salary_component?.component_name,
      componentCode: data.salary_component?.component_code,
      abbr: data.salary_component?.abbr,
      amountBasedOnFormula: data.amount_based_on_formula,
      formula: data.formula,
      amount: data.amount,
      isTaxApplicable: data.salary_component?.is_tax_applicable ?? true,
      dependsOnPaymentDays: data.salary_component?.depends_on_payment_days ?? true,
      idx: data.idx,
    };
  }

  /**
   * Add deduction to salary structure
   */
  static async addDeductionToStructure(
    structureId: string,
    deduction: {
      salaryComponentId: string;
      amountBasedOnFormula?: boolean;
      formula?: string;
      amount?: number;
    }
  ): Promise<SalaryStructureDeduction> {
    const supabase = await createClient();

    // Get max idx
    const { data: maxIdxResult } = await supabase
      .from('salary_structure_deductions')
      .select('idx')
      .eq('salary_structure_id', structureId)
      .order('idx', { ascending: false })
      .limit(1);

    const nextIdx = (maxIdxResult?.[0]?.idx || 0) + 1;

    const { data, error } = await supabase
      .from('salary_structure_deductions')
      .insert({
        salary_structure_id: structureId,
        salary_component_id: deduction.salaryComponentId,
        amount_based_on_formula: deduction.amountBasedOnFormula ?? false,
        formula: deduction.formula,
        amount: deduction.amount ?? 0,
        idx: nextIdx,
      })
      .select(`
        *,
        salary_component:salary_components(component_name, component_code, abbr, is_statutory)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add deduction: ${error.message}`);
    }

    return {
      id: data.id,
      salaryStructureId: data.salary_structure_id,
      salaryComponentId: data.salary_component_id,
      componentName: data.salary_component?.component_name,
      componentCode: data.salary_component?.component_code,
      abbr: data.salary_component?.abbr,
      amountBasedOnFormula: data.amount_based_on_formula,
      formula: data.formula,
      amount: data.amount,
      isStatutory: data.salary_component?.is_statutory ?? false,
      idx: data.idx,
    };
  }

  // ==================== SALARY STRUCTURE ASSIGNMENTS ====================

  /**
   * Create salary structure assignment for an employee
   */
  static async createAssignment(
    data: CreateSalaryStructureAssignment
  ): Promise<SalaryStructureAssignment> {
    const supabase = await createClient();

    // Check for overlapping assignments
    const { data: existing } = await supabase
      .from('salary_structure_assignments')
      .select('id')
      .eq('employee_id', data.employeeId)
      .eq('docstatus', 1)
      .or(`to_date.is.null,to_date.gte.${data.fromDate.toISOString()}`);

    if (existing && existing.length > 0) {
      // Close existing assignment
      await supabase
        .from('salary_structure_assignments')
        .update({
          to_date: new Date(data.fromDate.getTime() - 86400000).toISOString(), // Day before
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
    }

    const { data: assignment, error } = await supabase
      .from('salary_structure_assignments')
      .insert({
        org_id: data.orgId,
        employee_id: data.employeeId,
        salary_structure_id: data.salaryStructureId,
        from_date: data.fromDate,
        to_date: data.toDate,
        base_pay: data.basePay,
        variable_pay_percent: data.variablePayPercent,
        income_category: data.incomeCategory,
        docstatus: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }

    return this.mapAssignment(assignment);
  }

  /**
   * Get current salary structure assignment for an employee
   */
  static async getCurrentAssignment(
    employeeId: string,
    asOfDate?: Date
  ): Promise<{
    assignment: SalaryStructureAssignment;
    structure: SalaryStructure;
    earnings: SalaryStructureEarning[];
    deductions: SalaryStructureDeduction[];
  } | null> {
    const supabase = await createClient();
    const date = asOfDate || new Date();

    const { data: assignment, error } = await supabase
      .from('salary_structure_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('docstatus', 1)
      .lte('from_date', date.toISOString())
      .or(`to_date.is.null,to_date.gte.${date.toISOString()}`)
      .order('from_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !assignment) {
      return null;
    }

    const structureData = await this.getSalaryStructureById(assignment.salary_structure_id);

    if (!structureData) {
      return null;
    }

    return {
      assignment: this.mapAssignment(assignment),
      structure: structureData.structure,
      earnings: structureData.earnings,
      deductions: structureData.deductions,
    };
  }

  /**
   * List assignments for an employee
   */
  static async listAssignments(
    employeeId: string,
    options?: { includeInactive?: boolean }
  ): Promise<SalaryStructureAssignment[]> {
    const supabase = await createClient();

    let query = supabase
      .from('salary_structure_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('from_date', { ascending: false });

    if (!options?.includeInactive) {
      query = query.eq('docstatus', 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list assignments: ${error.message}`);
    }

    return (data || []).map(this.mapAssignment);
  }

  /**
   * Calculate earnings for an employee based on their salary structure
   */
  static async calculateEarnings(
    employeeId: string,
    variables: {
      basePay: number;
      paymentDays: number;
      totalDays: number;
      grossPay?: number;
      [key: string]: number | undefined;
    },
    asOfDate?: Date
  ): Promise<{
    earnings: Array<{
      componentId: string;
      componentName: string;
      abbr: string;
      amount: number;
      isTaxApplicable: boolean;
    }>;
    totalEarnings: number;
    totalTaxableEarnings: number;
  }> {
    const assignmentData = await this.getCurrentAssignment(employeeId, asOfDate);

    if (!assignmentData) {
      throw new Error('No salary structure assignment found for employee');
    }

    const { earnings: structureEarnings, assignment } = assignmentData;

    // Build variables with base pay from assignment
    const calcVariables: Record<string, number> = {
      basePay: assignment.basePay,
      paymentDays: variables.paymentDays,
      totalDays: variables.totalDays,
      grossPay: variables.grossPay || 0,
      ...Object.fromEntries(
        Object.entries(variables).filter(([_, v]) => v !== undefined) as [string, number][]
      ),
    };

    const result: {
      earnings: Array<{
        componentId: string;
        componentName: string;
        abbr: string;
        amount: number;
        isTaxApplicable: boolean;
      }>;
      totalEarnings: number;
      totalTaxableEarnings: number;
    } = {
      earnings: [],
      totalEarnings: 0,
      totalTaxableEarnings: 0,
    };

    for (const earning of structureEarnings) {
      let amount: number;

      if (earning.amountBasedOnFormula && earning.formula) {
        amount = evaluateFormula(earning.formula, calcVariables);
      } else {
        amount = earning.amount;
      }

      // Apply payment days proration if applicable
      if (earning.dependsOnPaymentDays && calcVariables.totalDays > 0) {
        amount = (amount * calcVariables.paymentDays) / calcVariables.totalDays;
      }

      // Round to 2 decimal places
      amount = Math.round(amount * 100) / 100;

      result.earnings.push({
        componentId: earning.salaryComponentId,
        componentName: earning.componentName || '',
        abbr: earning.abbr || '',
        amount,
        isTaxApplicable: earning.isTaxApplicable,
      });

      result.totalEarnings += amount;
      if (earning.isTaxApplicable) {
        result.totalTaxableEarnings += amount;
      }

      // Update grossPay for subsequent calculations
      calcVariables.grossPay = result.totalEarnings;
    }

    return result;
  }

  // ==================== DEFAULT COMPONENTS SETUP ====================

  /**
   * Create default PH salary components for an organization
   */
  static async createDefaultPhilippinesComponents(orgId: string): Promise<void> {
    const defaultEarnings: CreateSalaryComponent[] = [
      {
        orgId,
        componentCode: 'BASIC',
        componentName: 'Basic Pay',
        componentType: 'Earning',
        abbr: 'BASIC',
        description: 'Basic monthly salary',
        isTaxApplicable: true,
        dependsOnPaymentDays: true,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'DEMINIMIS',
        componentName: 'De Minimis Benefits',
        componentType: 'Earning',
        abbr: 'DMNMS',
        description: 'Non-taxable de minimis benefits (up to BIR threshold)',
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'COLA',
        componentName: 'Cost of Living Allowance',
        componentType: 'Earning',
        abbr: 'COLA',
        description: 'Cost of living allowance',
        isTaxApplicable: true,
        dependsOnPaymentDays: true,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'TRANSPO',
        componentName: 'Transportation Allowance',
        componentType: 'Earning',
        abbr: 'TRNS',
        description: 'Transportation allowance',
        isTaxApplicable: true,
        dependsOnPaymentDays: true,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'OT',
        componentName: 'Overtime Pay',
        componentType: 'Earning',
        abbr: 'OT',
        description: 'Overtime compensation (125% of hourly rate)',
        isTaxApplicable: true,
        dependsOnPaymentDays: false,
        isRecurring: false,
        amountBasedOnFormula: true,
        formula: 'overtimeHours * hourRate * 1.25',
      },
      {
        orgId,
        componentCode: 'NIGHT',
        componentName: 'Night Differential',
        componentType: 'Earning',
        abbr: 'ND',
        description: 'Night differential pay (10PM-6AM)',
        isTaxApplicable: true,
        dependsOnPaymentDays: false,
        isRecurring: false,
        amountBasedOnFormula: true,
        formula: 'nightDiffHours * hourRate * 0.10',
      },
      {
        orgId,
        componentCode: 'HOLIDAY',
        componentName: 'Holiday Pay',
        componentType: 'Earning',
        abbr: 'HOL',
        description: 'Holiday premium pay',
        isTaxApplicable: true,
        dependsOnPaymentDays: false,
        isRecurring: false,
      },
      {
        orgId,
        componentCode: '13THMONTH',
        componentName: '13th Month Pay',
        componentType: 'Earning',
        abbr: '13TH',
        description: '13th month pay (non-taxable up to PHP 90,000)',
        isTaxApplicable: false, // Non-taxable up to threshold
        dependsOnPaymentDays: false,
        isRecurring: false,
      },
    ];

    const defaultDeductions: CreateSalaryComponent[] = [
      {
        orgId,
        componentCode: 'SSS_EE',
        componentName: 'SSS Contribution (Employee)',
        componentType: 'Deduction',
        abbr: 'SSS',
        description: 'Social Security System employee contribution',
        isStatutory: true,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'PHIC_EE',
        componentName: 'PhilHealth Contribution (Employee)',
        componentType: 'Deduction',
        abbr: 'PHIC',
        description: 'PhilHealth employee contribution',
        isStatutory: true,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'HDMF_EE',
        componentName: 'Pag-IBIG Contribution (Employee)',
        componentType: 'Deduction',
        abbr: 'HDMF',
        description: 'Pag-IBIG Fund employee contribution',
        isStatutory: true,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'WTAX',
        componentName: 'Withholding Tax',
        componentType: 'Deduction',
        abbr: 'TAX',
        description: 'Income tax withholding (BIR TRAIN Law)',
        isStatutory: true,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'SSS_LOAN',
        componentName: 'SSS Loan',
        componentType: 'Deduction',
        abbr: 'SSSL',
        description: 'SSS salary loan deduction',
        isStatutory: false,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'HDMF_LOAN',
        componentName: 'Pag-IBIG Loan',
        componentType: 'Deduction',
        abbr: 'HDMFL',
        description: 'Pag-IBIG salary loan deduction',
        isStatutory: false,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: true,
      },
      {
        orgId,
        componentCode: 'CASH_ADV',
        componentName: 'Cash Advance',
        componentType: 'Deduction',
        abbr: 'CA',
        description: 'Cash advance deduction',
        isStatutory: false,
        isTaxApplicable: false,
        dependsOnPaymentDays: false,
        isRecurring: false,
      },
    ];

    // Create earnings
    for (const earning of defaultEarnings) {
      try {
        await this.createSalaryComponent(earning);
      } catch (error) {
        // Component might already exist, skip
        console.log(`Skipping existing component: ${earning.componentCode}`);
      }
    }

    // Create deductions
    for (const deduction of defaultDeductions) {
      try {
        await this.createSalaryComponent(deduction);
      } catch (error) {
        // Component might already exist, skip
        console.log(`Skipping existing component: ${deduction.componentCode}`);
      }
    }
  }

  // ==================== MAPPERS ====================

  private static mapSalaryComponent(data: Record<string, unknown>): SalaryComponent {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      componentCode: data.component_code as string,
      componentName: data.component_name as string,
      componentType: data.component_type as 'Earning' | 'Deduction',
      description: data.description as string | undefined,
      isPayableBased: data.is_payable_based as boolean,
      dependsOnPaymentDays: data.depends_on_payment_days as boolean,
      isRecurring: data.is_recurring as boolean,
      isTaxApplicable: data.is_tax_applicable as boolean,
      amountBasedOnFormula: data.amount_based_on_formula as boolean,
      formula: data.formula as string | undefined,
      defaultAmount: data.default_amount as number,
      isStatutory: data.is_statutory as boolean,
      statisticalComponent: data.statistical_component as boolean,
      doNotIncludeInTotal: data.do_not_include_in_total as boolean,
      abbr: data.abbr as string,
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private static mapSalaryStructure(data: Record<string, unknown>): SalaryStructure {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      structureName: data.structure_name as string,
      description: data.description as string | undefined,
      isActive: data.is_active as boolean,
      payrollFrequency: data.payroll_frequency as 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Bi-Weekly',
      modeOfPayment: data.mode_of_payment as string | undefined,
      paymentAccount: data.payment_account as string | undefined,
      companyId: data.company_id as string | undefined,
      currencyCode: data.currency_code as string,
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private static mapAssignment(data: Record<string, unknown>): SalaryStructureAssignment {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      employeeId: data.employee_id as string,
      salaryStructureId: data.salary_structure_id as string,
      fromDate: new Date(data.from_date as string),
      toDate: data.to_date ? new Date(data.to_date as string) : undefined,
      basePay: data.base_pay as number,
      variablePayPercent: data.variable_pay_percent as number | undefined,
      incomeCategory: data.income_category as string | undefined,
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}
