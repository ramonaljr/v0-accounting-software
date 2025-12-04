/**
 * Holiday Pay Service
 * Handles holiday pay calculations and holiday data management
 */

import { createClient } from '@/lib/supabase/server';
import type { HolidayPayResult, HolidayData, PeriodHolidayPayResult } from './types';

export class HolidayPayService {
  /**
   * Get holiday pay computation for an attendance date
   */
  static async computeHolidayPay(
    orgId: string,
    employeeId: string,
    attendanceDate: Date,
    dailyRate: number,
    hoursWorked?: number
  ): Promise<HolidayPayResult> {
    const supabase = await createClient();

    // Try to use the database function
    const { data, error } = await supabase.rpc('compute_holiday_pay', {
      p_org_id: orgId,
      p_employee_id: employeeId,
      p_attendance_date: attendanceDate.toISOString().split('T')[0],
      p_daily_rate: dailyRate,
      p_hours_worked: hoursWorked || 8,
    });

    if (!error && data && data.length > 0) {
      const result = data[0];
      return {
        holidayType: result.holiday_type,
        basePay: parseFloat(result.base_pay) || dailyRate,
        holidayPremium: parseFloat(result.holiday_premium) || 0,
        totalPay: parseFloat(result.total_pay) || dailyRate,
      };
    }

    // Fallback: Check for holiday manually
    const { data: holiday } = await supabase
      .from('holidays')
      .select(`
        holiday_type,
        holiday_pay_rate,
        holiday_lists!inner (
          org_id,
          is_default
        )
      `)
      .eq('holiday_date', attendanceDate.toISOString().split('T')[0])
      .eq('holiday_lists.org_id', orgId)
      .eq('holiday_lists.is_default', true)
      .maybeSingle();

    if (!holiday) {
      // Not a holiday
      return {
        holidayType: null,
        basePay: dailyRate,
        holidayPremium: 0,
        totalPay: dailyRate,
      };
    }

    // Calculate based on PH Labor Code
    const holidayRates: Record<string, number> = {
      'Regular': 2.0,           // 200% for regular holidays
      'Special Non-Working': 1.30,  // 130% for special non-working
      'Special Working': 1.30,
    };

    const rate = holiday.holiday_pay_rate || holidayRates[holiday.holiday_type] || 1.0;
    const holidayPremium = Math.round(dailyRate * (rate - 1) * 100) / 100;
    const totalPay = Math.round(dailyRate * rate * 100) / 100;

    return {
      holidayType: holiday.holiday_type,
      basePay: dailyRate,
      holidayPremium,
      totalPay,
    };
  }

  /**
   * Get all holidays in a date range
   */
  static async getHolidaysInRange(
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<HolidayData[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holidays')
      .select(`
        holiday_date,
        holiday_name,
        holiday_type,
        holiday_pay_rate,
        holiday_lists!inner (
          org_id,
          is_default
        )
      `)
      .gte('holiday_date', fromDate.toISOString().split('T')[0])
      .lte('holiday_date', toDate.toISOString().split('T')[0])
      .eq('holiday_lists.org_id', orgId)
      .eq('holiday_lists.is_default', true)
      .order('holiday_date', { ascending: true });

    if (error || !data) {
      return [];
    }

    const holidayRates: Record<string, number> = {
      'Regular': 2.0,
      'Special Non-Working': 1.30,
      'Special Working': 1.30,
    };

    return data.map((h) => ({
      date: new Date(h.holiday_date),
      name: h.holiday_name,
      holidayType: h.holiday_type,
      payRate: h.holiday_pay_rate || holidayRates[h.holiday_type] || 1.0,
    }));
  }

  /**
   * Calculate holiday pay for an entire payroll period
   */
  static async calculatePeriodHolidayPay(
    orgId: string,
    employeeId: string,
    fromDate: Date,
    toDate: Date,
    dailyRate: number
  ): Promise<PeriodHolidayPayResult> {
    const holidays = await this.getHolidaysInRange(orgId, fromDate, toDate);

    let regularHolidayPay = 0;
    let specialHolidayPay = 0;
    const holidayDetails: Array<{
      date: Date;
      name: string;
      type: string;
      amount: number;
    }> = [];

    for (const holiday of holidays) {
      const dayOfWeek = holiday.date.getDay();
      // Skip weekends for holiday pay (unless worked - handled separately)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const premium = Math.round(dailyRate * (holiday.payRate - 1) * 100) / 100;

      if (holiday.holidayType === 'Regular') {
        regularHolidayPay += premium;
      } else {
        specialHolidayPay += premium;
      }

      holidayDetails.push({
        date: holiday.date,
        name: holiday.name,
        type: holiday.holidayType,
        amount: premium,
      });
    }

    return {
      holidayDays: holidayDetails.length,
      regularHolidayPay: Math.round(regularHolidayPay * 100) / 100,
      specialHolidayPay: Math.round(specialHolidayPay * 100) / 100,
      totalHolidayPay: Math.round((regularHolidayPay + specialHolidayPay) * 100) / 100,
      holidays: holidayDetails,
    };
  }
}
