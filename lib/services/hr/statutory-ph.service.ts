/**
 * Philippines Statutory Deductions Service
 * Computes SSS, PhilHealth, Pag-IBIG, and BIR withholding tax
 * Based on 2024 Philippine statutory rates
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SssContributionEntry,
  PhilhealthContributionEntry,
  PagibigContributionEntry,
  BirWithholdingTaxEntry,
  SssContributionResult,
  PhilhealthContributionResult,
  PagibigContributionResult,
  CreateSssContribution,
  CreatePhilhealthContribution,
  CreatePagibigContribution,
  CreateBirWithholdingTax,
  PH_STATUTORY_RATES_2024,
} from '@/lib/models/hr/statutory-ph';

export class HrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HrError';
  }
}

export class PhStatutoryService {
  // =============================================
  // SSS CONTRIBUTIONS
  // =============================================

  /**
   * Compute SSS contribution based on monthly compensation
   */
  static async computeSssContribution(
    orgId: string,
    monthlyCompensation: number,
    effectiveDate: Date = new Date()
  ): Promise<SssContributionResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sss_contribution_table')
      .select('*')
      .eq('org_id', orgId)
      .lte('effective_date', effectiveDate.toISOString())
      .or(`end_date.is.null,end_date.gte.${effectiveDate.toISOString()}`)
      .gte('compensation_range_to', monthlyCompensation)
      .lte('compensation_range_from', monthlyCompensation)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Return zeros if no table found (might need to set up)
      return {
        employeeContribution: 0,
        employerContribution: 0,
        employerEc: 0,
        employeeWisp: 0,
        employerWisp: 0,
        totalContribution: 0,
        monthlySalaryCredit: 0,
      };
    }

    return {
      employeeContribution: parseFloat(data.employee_contribution) || 0,
      employerContribution: parseFloat(data.employer_contribution_ss) || 0,
      employerEc: parseFloat(data.employer_contribution_ec) || 0,
      employeeWisp: parseFloat(data.employee_contribution_wisp) || 0,
      employerWisp: parseFloat(data.employer_contribution_wisp) || 0,
      totalContribution: parseFloat(data.total_contribution) || 0,
      monthlySalaryCredit: parseFloat(data.monthly_salary_credit) || 0,
    };
  }

  /**
   * Create SSS contribution table entry
   */
  static async createSssEntry(input: CreateSssContribution): Promise<SssContributionEntry> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sss_contribution_table')
      .insert({
        org_id: input.orgId,
        effective_date: input.effectiveDate.toISOString(),
        end_date: input.endDate?.toISOString(),
        compensation_range_from: input.compensationRangeFrom,
        compensation_range_to: input.compensationRangeTo,
        monthly_salary_credit: input.monthlySalaryCredit,
        employer_contribution_ss: input.employerContributionSs,
        employer_contribution_ec: input.employerContributionEc,
        employee_contribution: input.employeeContribution,
        employer_contribution_wisp: input.employerContributionWisp,
        employee_contribution_wisp: input.employeeContributionWisp,
        total_contribution: input.totalContribution,
      })
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to create SSS entry: ${error.message}`);
    }

    return this.mapDbToSssEntry(data);
  }

  /**
   * Seed SSS contribution table with 2024 rates
   */
  static async seedSssTable2024(orgId: string): Promise<void> {
    const supabase = await createClient();

    // 2024 SSS Contribution Table (simplified version)
    // Full table has more brackets - this is representative
    const sssTable2024 = [
      { from: 0, to: 4249.99, msc: 4000, ee: 180, erSs: 380, erEc: 10 },
      { from: 4250, to: 4749.99, msc: 4500, ee: 202.50, erSs: 427.50, erEc: 10 },
      { from: 4750, to: 5249.99, msc: 5000, ee: 225, erSs: 475, erEc: 10 },
      { from: 5250, to: 5749.99, msc: 5500, ee: 247.50, erSs: 522.50, erEc: 10 },
      { from: 5750, to: 6249.99, msc: 6000, ee: 270, erSs: 570, erEc: 10 },
      { from: 6250, to: 6749.99, msc: 6500, ee: 292.50, erSs: 617.50, erEc: 10 },
      { from: 6750, to: 7249.99, msc: 7000, ee: 315, erSs: 665, erEc: 10 },
      { from: 7250, to: 7749.99, msc: 7500, ee: 337.50, erSs: 712.50, erEc: 10 },
      { from: 7750, to: 8249.99, msc: 8000, ee: 360, erSs: 760, erEc: 10 },
      { from: 8250, to: 8749.99, msc: 8500, ee: 382.50, erSs: 807.50, erEc: 10 },
      { from: 8750, to: 9249.99, msc: 9000, ee: 405, erSs: 855, erEc: 10 },
      { from: 9250, to: 9749.99, msc: 9500, ee: 427.50, erSs: 902.50, erEc: 10 },
      { from: 9750, to: 10249.99, msc: 10000, ee: 450, erSs: 950, erEc: 10 },
      { from: 10250, to: 10749.99, msc: 10500, ee: 472.50, erSs: 997.50, erEc: 10 },
      { from: 10750, to: 11249.99, msc: 11000, ee: 495, erSs: 1045, erEc: 10 },
      { from: 11250, to: 11749.99, msc: 11500, ee: 517.50, erSs: 1092.50, erEc: 10 },
      { from: 11750, to: 12249.99, msc: 12000, ee: 540, erSs: 1140, erEc: 10 },
      { from: 12250, to: 12749.99, msc: 12500, ee: 562.50, erSs: 1187.50, erEc: 10 },
      { from: 12750, to: 13249.99, msc: 13000, ee: 585, erSs: 1235, erEc: 10 },
      { from: 13250, to: 13749.99, msc: 13500, ee: 607.50, erSs: 1282.50, erEc: 10 },
      { from: 13750, to: 14249.99, msc: 14000, ee: 630, erSs: 1330, erEc: 10 },
      { from: 14250, to: 14749.99, msc: 14500, ee: 652.50, erSs: 1377.50, erEc: 10 },
      { from: 14750, to: 15249.99, msc: 15000, ee: 675, erSs: 1425, erEc: 30 },
      { from: 15250, to: 15749.99, msc: 15500, ee: 697.50, erSs: 1472.50, erEc: 30 },
      { from: 15750, to: 16249.99, msc: 16000, ee: 720, erSs: 1520, erEc: 30 },
      { from: 16250, to: 16749.99, msc: 16500, ee: 742.50, erSs: 1567.50, erEc: 30 },
      { from: 16750, to: 17249.99, msc: 17000, ee: 765, erSs: 1615, erEc: 30 },
      { from: 17250, to: 17749.99, msc: 17500, ee: 787.50, erSs: 1662.50, erEc: 30 },
      { from: 17750, to: 18249.99, msc: 18000, ee: 810, erSs: 1710, erEc: 30 },
      { from: 18250, to: 18749.99, msc: 18500, ee: 832.50, erSs: 1757.50, erEc: 30 },
      { from: 18750, to: 19249.99, msc: 19000, ee: 855, erSs: 1805, erEc: 30 },
      { from: 19250, to: 19749.99, msc: 19500, ee: 877.50, erSs: 1852.50, erEc: 30 },
      { from: 19750, to: 20249.99, msc: 20000, ee: 900, erSs: 1900, erEc: 30 },
      // WISP starts from 20k MSC
      { from: 20250, to: 24749.99, msc: 22500, ee: 1012.50, erSs: 2137.50, erEc: 30, eeWisp: 112.50, erWisp: 112.50 },
      { from: 24750, to: 29249.99, msc: 27000, ee: 1215, erSs: 2565, erEc: 30, eeWisp: 135, erWisp: 135 },
      { from: 29250, to: 34749.99, msc: 32000, ee: 1440, erSs: 3040, erEc: 30, eeWisp: 160, erWisp: 160 },
      { from: 34750, to: 999999, msc: 35000, ee: 1575, erSs: 3325, erEc: 30, eeWisp: 175, erWisp: 175 },
    ];

    const effectiveDate = new Date('2024-01-01');

    for (const row of sssTable2024) {
      await supabase.from('sss_contribution_table').upsert({
        org_id: orgId,
        effective_date: effectiveDate.toISOString(),
        compensation_range_from: row.from,
        compensation_range_to: row.to,
        monthly_salary_credit: row.msc,
        employer_contribution_ss: row.erSs,
        employer_contribution_ec: row.erEc,
        employee_contribution: row.ee,
        employer_contribution_wisp: row.erWisp || 0,
        employee_contribution_wisp: row.eeWisp || 0,
        total_contribution: row.ee + row.erSs + row.erEc + (row.eeWisp || 0) + (row.erWisp || 0),
      }, {
        onConflict: 'org_id,effective_date,compensation_range_from',
      });
    }
  }

  // =============================================
  // PHILHEALTH CONTRIBUTIONS
  // =============================================

  /**
   * Compute PhilHealth contribution based on monthly basic salary
   */
  static async computePhilhealthContribution(
    orgId: string,
    monthlyBasicSalary: number,
    effectiveDate: Date = new Date()
  ): Promise<PhilhealthContributionResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('philhealth_contribution_table')
      .select('*')
      .eq('org_id', orgId)
      .lte('effective_date', effectiveDate.toISOString())
      .or(`end_date.is.null,end_date.gte.${effectiveDate.toISOString()}`)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Default 2024 PhilHealth rates if no table found
      const rate = 0.05;
      const floor = 10000;
      const ceiling = 100000;
      const base = Math.max(Math.min(monthlyBasicSalary, ceiling), floor);
      const total = base * rate;

      return {
        employeeShare: Math.round(total / 2 * 100) / 100,
        employerShare: Math.round(total / 2 * 100) / 100,
        totalContribution: Math.round(total * 100) / 100,
      };
    }

    const rate = parseFloat(data.premium_rate) || 0.05;
    const floor = parseFloat(data.income_floor) || 10000;
    const ceiling = parseFloat(data.income_ceiling) || 100000;
    const eeRate = parseFloat(data.employee_share_rate) || 0.5;
    const erRate = parseFloat(data.employer_share_rate) || 0.5;

    const base = Math.max(Math.min(monthlyBasicSalary, ceiling), floor);
    const total = base * rate;

    return {
      employeeShare: Math.round(total * eeRate * 100) / 100,
      employerShare: Math.round(total * erRate * 100) / 100,
      totalContribution: Math.round(total * 100) / 100,
    };
  }

  /**
   * Create PhilHealth contribution table entry
   */
  static async createPhilhealthEntry(
    input: CreatePhilhealthContribution
  ): Promise<PhilhealthContributionEntry> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('philhealth_contribution_table')
      .insert({
        org_id: input.orgId,
        effective_date: input.effectiveDate.toISOString(),
        end_date: input.endDate?.toISOString(),
        premium_rate: input.premiumRate,
        income_floor: input.incomeFloor,
        income_ceiling: input.incomeCeiling,
        min_contribution: input.minContribution,
        max_contribution: input.maxContribution,
        employee_share_rate: input.employeeShareRate,
        employer_share_rate: input.employerShareRate,
      })
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to create PhilHealth entry: ${error.message}`);
    }

    return this.mapDbToPhilhealthEntry(data);
  }

  /**
   * Seed PhilHealth contribution table with 2024 rates
   */
  static async seedPhilhealthTable2024(orgId: string): Promise<void> {
    const supabase = await createClient();

    await supabase.from('philhealth_contribution_table').upsert({
      org_id: orgId,
      effective_date: new Date('2024-01-01').toISOString(),
      premium_rate: 0.05, // 5%
      income_floor: 10000,
      income_ceiling: 100000,
      employee_share_rate: 0.5,
      employer_share_rate: 0.5,
    }, {
      onConflict: 'org_id,effective_date',
    });
  }

  // =============================================
  // PAG-IBIG CONTRIBUTIONS
  // =============================================

  /**
   * Compute Pag-IBIG contribution based on monthly compensation
   */
  static async computePagibigContribution(
    orgId: string,
    monthlyCompensation: number,
    effectiveDate: Date = new Date()
  ): Promise<PagibigContributionResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pagibig_contribution_table')
      .select('*')
      .eq('org_id', orgId)
      .lte('effective_date', effectiveDate.toISOString())
      .or(`end_date.is.null,end_date.gte.${effectiveDate.toISOString()}`)
      .lte('compensation_range_from', monthlyCompensation)
      .or(`compensation_range_to.is.null,compensation_range_to.gte.${monthlyCompensation}`)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Default Pag-IBIG rates if no table found
      const maxBase = 5000;
      const base = Math.min(monthlyCompensation, maxBase);
      const eeRate = monthlyCompensation <= 1500 ? 0.01 : 0.02;
      const erRate = 0.02;

      return {
        employeeContribution: Math.round(base * eeRate * 100) / 100,
        employerContribution: Math.round(base * erRate * 100) / 100,
        totalContribution: Math.round(base * (eeRate + erRate) * 100) / 100,
      };
    }

    const eeRate = parseFloat(data.employee_rate) || 0.02;
    const erRate = parseFloat(data.employer_rate) || 0.02;
    const maxBase = parseFloat(data.max_compensation_for_computation) || 5000;

    const base = Math.min(monthlyCompensation, maxBase);

    return {
      employeeContribution: Math.round(base * eeRate * 100) / 100,
      employerContribution: Math.round(base * erRate * 100) / 100,
      totalContribution: Math.round(base * (eeRate + erRate) * 100) / 100,
    };
  }

  /**
   * Create Pag-IBIG contribution table entry
   */
  static async createPagibigEntry(
    input: CreatePagibigContribution
  ): Promise<PagibigContributionEntry> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pagibig_contribution_table')
      .insert({
        org_id: input.orgId,
        effective_date: input.effectiveDate.toISOString(),
        end_date: input.endDate?.toISOString(),
        compensation_range_from: input.compensationRangeFrom,
        compensation_range_to: input.compensationRangeTo,
        employee_rate: input.employeeRate,
        employer_rate: input.employerRate,
        max_compensation_for_computation: input.maxCompensationForComputation,
        allow_additional_contribution: input.allowAdditionalContribution,
      })
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to create Pag-IBIG entry: ${error.message}`);
    }

    return this.mapDbToPagibigEntry(data);
  }

  /**
   * Seed Pag-IBIG contribution table with 2024 rates
   */
  static async seedPagibigTable2024(orgId: string): Promise<void> {
    const supabase = await createClient();

    // Below P1,500: EE 1%, ER 2%
    await supabase.from('pagibig_contribution_table').upsert({
      org_id: orgId,
      effective_date: new Date('2024-01-01').toISOString(),
      compensation_range_from: 0,
      compensation_range_to: 1500,
      employee_rate: 0.01,
      employer_rate: 0.02,
      max_compensation_for_computation: 5000,
      allow_additional_contribution: true,
    }, {
      onConflict: 'org_id,effective_date,compensation_range_from',
    });

    // P1,500 and above: EE 2%, ER 2%
    await supabase.from('pagibig_contribution_table').upsert({
      org_id: orgId,
      effective_date: new Date('2024-01-01').toISOString(),
      compensation_range_from: 1500.01,
      compensation_range_to: null, // No upper limit
      employee_rate: 0.02,
      employer_rate: 0.02,
      max_compensation_for_computation: 5000,
      allow_additional_contribution: true,
    }, {
      onConflict: 'org_id,effective_date,compensation_range_from',
    });
  }

  // =============================================
  // BIR WITHHOLDING TAX
  // =============================================

  /**
   * Compute BIR withholding tax based on taxable income
   */
  static async computeWithholdingTax(
    orgId: string,
    taxableIncome: number,
    payrollFrequency: 'Annual' | 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Daily' = 'Monthly',
    effectiveDate: Date = new Date()
  ): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bir_withholding_tax_table')
      .select('*')
      .eq('org_id', orgId)
      .eq('payroll_frequency', payrollFrequency)
      .lte('effective_date', effectiveDate.toISOString())
      .or(`end_date.is.null,end_date.gte.${effectiveDate.toISOString()}`)
      .lte('compensation_range_from', taxableIncome)
      .or(`compensation_range_to.is.null,compensation_range_to.gt.${taxableIncome}`)
      .order('effective_date', { ascending: false })
      .order('compensation_range_from', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Use default TRAIN Law rates if no table found
      return this.computeTrainLawTax(taxableIncome, payrollFrequency);
    }

    const fixedTax = parseFloat(data.fixed_tax) || 0;
    const taxRate = parseFloat(data.tax_rate) || 0;
    const excessOver = parseFloat(data.excess_over) || 0;

    const tax = fixedTax + ((taxableIncome - excessOver) * taxRate);
    return Math.max(Math.round(tax * 100) / 100, 0);
  }

  /**
   * Compute TRAIN Law tax (hardcoded 2024 rates as fallback)
   */
  private static computeTrainLawTax(
    taxableIncome: number,
    frequency: 'Annual' | 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Daily'
  ): number {
    // Convert to monthly for calculation
    let monthlyIncome = taxableIncome;
    switch (frequency) {
      case 'Annual':
        monthlyIncome = taxableIncome / 12;
        break;
      case 'Semi-Monthly':
        monthlyIncome = taxableIncome * 2;
        break;
      case 'Weekly':
        monthlyIncome = taxableIncome * 4.33;
        break;
      case 'Daily':
        monthlyIncome = taxableIncome * 22;
        break;
    }

    // 2024 Monthly Tax Table (TRAIN Law)
    let tax = 0;
    if (monthlyIncome <= 20833) {
      tax = 0;
    } else if (monthlyIncome <= 33332) {
      tax = (monthlyIncome - 20833) * 0.15;
    } else if (monthlyIncome <= 66666) {
      tax = 1875 + (monthlyIncome - 33333) * 0.20;
    } else if (monthlyIncome <= 166666) {
      tax = 8541.80 + (monthlyIncome - 66667) * 0.25;
    } else if (monthlyIncome <= 666666) {
      tax = 33541.80 + (monthlyIncome - 166667) * 0.30;
    } else {
      tax = 183541.80 + (monthlyIncome - 666667) * 0.35;
    }

    // Convert back to original frequency
    switch (frequency) {
      case 'Annual':
        tax = tax * 12;
        break;
      case 'Semi-Monthly':
        tax = tax / 2;
        break;
      case 'Weekly':
        tax = tax / 4.33;
        break;
      case 'Daily':
        tax = tax / 22;
        break;
    }

    return Math.max(Math.round(tax * 100) / 100, 0);
  }

  /**
   * Create BIR withholding tax table entry
   */
  static async createBirTaxEntry(
    input: CreateBirWithholdingTax
  ): Promise<BirWithholdingTaxEntry> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bir_withholding_tax_table')
      .insert({
        org_id: input.orgId,
        effective_date: input.effectiveDate.toISOString(),
        end_date: input.endDate?.toISOString(),
        payroll_frequency: input.payrollFrequency,
        compensation_range_from: input.compensationRangeFrom,
        compensation_range_to: input.compensationRangeTo,
        fixed_tax: input.fixedTax,
        tax_rate: input.taxRate,
        excess_over: input.excessOver,
      })
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to create BIR tax entry: ${error.message}`);
    }

    return this.mapDbToBirEntry(data);
  }

  /**
   * Seed BIR withholding tax table with 2024 TRAIN Law rates
   */
  static async seedBirTaxTable2024(orgId: string): Promise<void> {
    const supabase = await createClient();

    const effectiveDate = new Date('2024-01-01');

    // Monthly tax brackets (TRAIN Law)
    const monthlyBrackets = [
      { from: 0, to: 20833, fixed: 0, rate: 0, excess: 0 },
      { from: 20833, to: 33332, fixed: 0, rate: 0.15, excess: 20833 },
      { from: 33333, to: 66666, fixed: 1875, rate: 0.20, excess: 33333 },
      { from: 66667, to: 166666, fixed: 8541.80, rate: 0.25, excess: 66667 },
      { from: 166667, to: 666666, fixed: 33541.80, rate: 0.30, excess: 166667 },
      { from: 666667, to: null, fixed: 183541.80, rate: 0.35, excess: 666667 },
    ];

    for (const bracket of monthlyBrackets) {
      await supabase.from('bir_withholding_tax_table').upsert({
        org_id: orgId,
        effective_date: effectiveDate.toISOString(),
        payroll_frequency: 'Monthly',
        compensation_range_from: bracket.from,
        compensation_range_to: bracket.to,
        fixed_tax: bracket.fixed,
        tax_rate: bracket.rate,
        excess_over: bracket.excess,
      }, {
        onConflict: 'org_id,effective_date,payroll_frequency,compensation_range_from',
      });
    }

    // Semi-monthly tax brackets (divide monthly by 2)
    for (const bracket of monthlyBrackets) {
      await supabase.from('bir_withholding_tax_table').upsert({
        org_id: orgId,
        effective_date: effectiveDate.toISOString(),
        payroll_frequency: 'Semi-Monthly',
        compensation_range_from: bracket.from / 2,
        compensation_range_to: bracket.to ? bracket.to / 2 : null,
        fixed_tax: bracket.fixed / 2,
        tax_rate: bracket.rate,
        excess_over: bracket.excess / 2,
      }, {
        onConflict: 'org_id,effective_date,payroll_frequency,compensation_range_from',
      });
    }
  }

  /**
   * Seed all statutory tables for a new organization
   */
  static async seedAllStatutoryTables(orgId: string): Promise<void> {
    await Promise.all([
      this.seedSssTable2024(orgId),
      this.seedPhilhealthTable2024(orgId),
      this.seedPagibigTable2024(orgId),
      this.seedBirTaxTable2024(orgId),
    ]);
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  /**
   * Compute all statutory deductions for an employee
   */
  static async computeAllStatutoryDeductions(
    orgId: string,
    monthlyBasicPay: number,
    monthlyGrossPay: number,
    effectiveDate: Date = new Date()
  ): Promise<{
    sss: SssContributionResult;
    philhealth: PhilhealthContributionResult;
    pagibig: PagibigContributionResult;
    totalEmployeeDeductions: number;
    totalEmployerContributions: number;
  }> {
    const [sss, philhealth, pagibig] = await Promise.all([
      this.computeSssContribution(orgId, monthlyGrossPay, effectiveDate),
      this.computePhilhealthContribution(orgId, monthlyBasicPay, effectiveDate),
      this.computePagibigContribution(orgId, monthlyGrossPay, effectiveDate),
    ]);

    const totalEmployeeDeductions =
      sss.employeeContribution +
      sss.employeeWisp +
      philhealth.employeeShare +
      pagibig.employeeContribution;

    const totalEmployerContributions =
      sss.employerContribution +
      sss.employerEc +
      sss.employerWisp +
      philhealth.employerShare +
      pagibig.employerContribution;

    return {
      sss,
      philhealth,
      pagibig,
      totalEmployeeDeductions,
      totalEmployerContributions,
    };
  }

  // Mapping functions
  private static mapDbToSssEntry(row: any): SssContributionEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      effectiveDate: new Date(row.effective_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      compensationRangeFrom: parseFloat(row.compensation_range_from) || 0,
      compensationRangeTo: parseFloat(row.compensation_range_to) || 0,
      monthlySalaryCredit: parseFloat(row.monthly_salary_credit) || 0,
      employerContributionSs: parseFloat(row.employer_contribution_ss) || 0,
      employerContributionEc: parseFloat(row.employer_contribution_ec) || 0,
      employeeContribution: parseFloat(row.employee_contribution) || 0,
      employerContributionWisp: parseFloat(row.employer_contribution_wisp) || 0,
      employeeContributionWisp: parseFloat(row.employee_contribution_wisp) || 0,
      totalContribution: parseFloat(row.total_contribution) || 0,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToPhilhealthEntry(row: any): PhilhealthContributionEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      effectiveDate: new Date(row.effective_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      premiumRate: parseFloat(row.premium_rate) || 0,
      incomeFloor: parseFloat(row.income_floor) || 0,
      incomeCeiling: parseFloat(row.income_ceiling) || 0,
      minContribution: row.min_contribution ? parseFloat(row.min_contribution) : undefined,
      maxContribution: row.max_contribution ? parseFloat(row.max_contribution) : undefined,
      employeeShareRate: parseFloat(row.employee_share_rate) || 0.5,
      employerShareRate: parseFloat(row.employer_share_rate) || 0.5,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToPagibigEntry(row: any): PagibigContributionEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      effectiveDate: new Date(row.effective_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      compensationRangeFrom: parseFloat(row.compensation_range_from) || 0,
      compensationRangeTo: row.compensation_range_to
        ? parseFloat(row.compensation_range_to)
        : undefined,
      employeeRate: parseFloat(row.employee_rate) || 0,
      employerRate: parseFloat(row.employer_rate) || 0,
      maxCompensationForComputation:
        parseFloat(row.max_compensation_for_computation) || 5000,
      allowAdditionalContribution: row.allow_additional_contribution ?? true,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToBirEntry(row: any): BirWithholdingTaxEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      effectiveDate: new Date(row.effective_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      payrollFrequency: row.payroll_frequency,
      compensationRangeFrom: parseFloat(row.compensation_range_from) || 0,
      compensationRangeTo: row.compensation_range_to
        ? parseFloat(row.compensation_range_to)
        : undefined,
      fixedTax: parseFloat(row.fixed_tax) || 0,
      taxRate: parseFloat(row.tax_rate) || 0,
      excessOver: parseFloat(row.excess_over) || 0,
      createdAt: new Date(row.created_at),
    };
  }
}
