/**
 * Holiday Service
 * Manages holiday lists and PH holiday management
 */

import { createClient } from '@/lib/supabase/server';
import type { HolidayList, Holiday, HolidayType } from '@/lib/models/hr';

export class HolidayService {
  /**
   * Create holiday list
   */
  static async createHolidayList(
    orgId: string,
    listName: string,
    fromDate: Date,
    toDate: Date,
    isDefault: boolean = false
  ): Promise<HolidayList> {
    const supabase = await createClient();

    const { data: list, error } = await supabase
      .from('holiday_lists')
      .insert({
        org_id: orgId,
        list_name: listName,
        from_date: fromDate,
        to_date: toDate,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create holiday list: ${error.message}`);
    }

    return {
      id: list.id,
      orgId: list.org_id,
      listName: list.list_name,
      fromDate: new Date(list.from_date),
      toDate: new Date(list.to_date),
      isDefault: list.is_default,
      createdAt: new Date(list.created_at),
    };
  }

  /**
   * Get default holiday list for organization
   */
  static async getDefaultHolidayList(orgId: string): Promise<HolidayList | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holiday_lists')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get default holiday list: ${error.message}`);
    }

    return {
      id: data.id,
      orgId: data.org_id,
      listName: data.list_name,
      fromDate: new Date(data.from_date),
      toDate: new Date(data.to_date),
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * List holiday lists for organization
   */
  static async listHolidayLists(orgId: string): Promise<HolidayList[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holiday_lists')
      .select('*')
      .eq('org_id', orgId)
      .order('from_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to list holiday lists: ${error.message}`);
    }

    return (data || []).map((list) => ({
      id: list.id,
      orgId: list.org_id,
      listName: list.list_name,
      fromDate: new Date(list.from_date),
      toDate: new Date(list.to_date),
      isDefault: list.is_default,
      createdAt: new Date(list.created_at),
    }));
  }

  /**
   * Add holiday to list
   */
  static async addHoliday(
    holidayListId: string,
    holidayDate: Date,
    description: string,
    holidayType: HolidayType = 'Regular',
    regularPayRate: number = 1.0,
    holidayPayRate?: number
  ): Promise<Holiday> {
    const supabase = await createClient();

    const { data: holiday, error } = await supabase
      .from('holidays')
      .insert({
        holiday_list_id: holidayListId,
        holiday_date: holidayDate,
        description: description,
        holiday_type: holidayType,
        regular_pay_rate: regularPayRate,
        holiday_pay_rate: holidayPayRate,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add holiday: ${error.message}`);
    }

    return {
      id: holiday.id,
      holidayListId: holiday.holiday_list_id,
      holidayDate: new Date(holiday.holiday_date),
      description: holiday.description,
      holidayType: holiday.holiday_type as HolidayType,
      regularPayRate: holiday.regular_pay_rate,
      holidayPayRate: holiday.holiday_pay_rate,
      createdAt: new Date(holiday.created_at),
    };
  }

  /**
   * Seed PH regular holidays for a year
   */
  static async seedPhHolidays(orgId: string, year: number): Promise<HolidayList> {
    // Create holiday list for the year
    const holidayList = await this.createHolidayList(
      orgId,
      `PH Holidays ${year}`,
      new Date(year, 0, 1),
      new Date(year, 11, 31),
      true // isDefault
    );

    // PH Regular Holidays
    const phHolidays = [
      { date: new Date(year, 0, 1), name: "New Year's Day" },
      { date: new Date(year, 3, 9), name: 'Araw ng Kagitingan (Day of Valor)' },
      { date: new Date(year, 4, 1), name: 'Labor Day' },
      { date: new Date(year, 5, 12), name: 'Independence Day' },
      { date: new Date(year, 7, 21), name: "Ninoy Aquino Day" },
      { date: new Date(year, 7, 26), name: 'National Heroes Day' },
      { date: new Date(year, 10, 30), name: 'Bonifacio Day' },
      { date: new Date(year, 11, 25), name: 'Christmas Day' },
      { date: new Date(year, 11, 30), name: 'Rizal Day' },
    ];

    // Special Non-Working Holidays
    const specialHolidays = [
      { date: new Date(year, 1, 25), name: 'EDSA People Power Revolution Anniversary' },
      { date: new Date(year, 7, 21), name: "Ninoy Aquino Day" },
      { date: new Date(year, 10, 1), name: "All Saints' Day" },
      { date: new Date(year, 10, 2), name: "All Souls' Day" },
      { date: new Date(year, 11, 8), name: 'Feast of the Immaculate Conception' },
      { date: new Date(year, 11, 24), name: 'Christmas Eve' },
      { date: new Date(year, 11, 31), name: "New Year's Eve" },
    ];

    // Add regular holidays
    for (const holiday of phHolidays) {
      await this.addHoliday(holidayList.id, holiday.date, holiday.name, 'Regular');
    }

    // Add special holidays
    for (const holiday of specialHolidays) {
      await this.addHoliday(holidayList.id, holiday.date, `${holiday.name}`, 'Special Non-Working');
    }

    return holidayList;
  }

  /**
   * Get holidays for date range
   */
  static async getHolidays(
    holidayListId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Holiday[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('holiday_list_id', holidayListId)
      .gte('holiday_date', fromDate.toISOString().split('T')[0])
      .lte('holiday_date', toDate.toISOString().split('T')[0])
      .order('holiday_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get holidays: ${error.message}`);
    }

    return (data || []).map((h) => ({
      id: h.id,
      holidayListId: h.holiday_list_id,
      holidayDate: new Date(h.holiday_date),
      description: h.description,
      holidayType: (h.holiday_type as HolidayType) || 'Regular',
      regularPayRate: h.regular_pay_rate || 1.0,
      holidayPayRate: h.holiday_pay_rate,
      createdAt: new Date(h.created_at),
    }));
  }

  /**
   * Check if a date is a holiday
   */
  static async isHoliday(
    orgId: string,
    date: Date
  ): Promise<{ isHoliday: boolean; holiday?: Holiday }> {
    const supabase = await createClient();

    // Get default holiday list
    const defaultList = await this.getDefaultHolidayList(orgId);
    if (!defaultList) {
      return { isHoliday: false };
    }

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('holiday_list_id', defaultList.id)
      .eq('holiday_date', date.toISOString().split('T')[0])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { isHoliday: false };
      }
      throw new Error(`Failed to check holiday: ${error.message}`);
    }

    return {
      isHoliday: true,
      holiday: {
        id: data.id,
        holidayListId: data.holiday_list_id,
        holidayDate: new Date(data.holiday_date),
        description: data.description,
        holidayType: (data.holiday_type as HolidayType) || 'Regular',
        regularPayRate: data.regular_pay_rate || 1.0,
        holidayPayRate: data.holiday_pay_rate,
        createdAt: new Date(data.created_at),
      },
    };
  }

  /**
   * Delete holiday
   */
  static async deleteHoliday(holidayId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', holidayId);

    if (error) {
      throw new Error(`Failed to delete holiday: ${error.message}`);
    }
  }

  /**
   * Update holiday
   */
  static async updateHoliday(
    holidayId: string,
    updates: {
      holidayDate?: Date;
      description?: string;
      holidayType?: HolidayType;
      regularPayRate?: number;
      holidayPayRate?: number;
    }
  ): Promise<Holiday> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holidays')
      .update({
        holiday_date: updates.holidayDate,
        description: updates.description,
        holiday_type: updates.holidayType,
        regular_pay_rate: updates.regularPayRate,
        holiday_pay_rate: updates.holidayPayRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', holidayId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update holiday: ${error.message}`);
    }

    return {
      id: data.id,
      holidayListId: data.holiday_list_id,
      holidayDate: new Date(data.holiday_date),
      description: data.description,
      holidayType: (data.holiday_type as HolidayType) || 'Regular',
      regularPayRate: data.regular_pay_rate || 1.0,
      holidayPayRate: data.holiday_pay_rate,
      createdAt: new Date(data.created_at),
    };
  }
}
