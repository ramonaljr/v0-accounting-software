/**
 * Job Card Service
 * Operation-level tracking for manufacturing
 * Based on ERPNext's job_card.py
 */

import { createClient } from '@/lib/supabase/server';
import type {
  JobCard,
  JobCardWithDetails,
  JobCardTimeLog,
  JobCardItem,
  JobCardScrapItem,
  CreateJobCard,
  CreateTimeLog,
  UpdateJobCard,
  JobCardStart,
  JobCardComplete,
  JobCardMaterialTransfer,
  JobCardSummary,
  JobCardStatus,
  WorkstationTimelineEntry,
  EmployeeWorkload,
} from '@/lib/models/manufacturing/job-card';
import { ManufacturingError } from './bom.service';
import { WorkOrderService } from './work-order.service';
import { StockEntryService } from '@/lib/services/stock/stock-entry.service';

export class JobCardService {
  /**
   * Create a new Job Card
   */
  static async create(input: CreateJobCard): Promise<JobCardWithDetails> {
    const supabase = await createClient();

    // Get work order details
    const wo = await WorkOrderService.getById(input.workOrderId);

    if (!['Not Started', 'In Process'].includes(wo.status)) {
      throw new ManufacturingError('Cannot create job card for this work order status');
    }

    // Get operation from work order
    const woOp = wo.operations.find(o => o.operationId === input.operationId);
    if (!woOp) {
      throw new ManufacturingError('Operation not found in work order');
    }

    // Generate job card number
    const { data: lastJc } = await supabase
      .from('job_cards')
      .select('job_card_no')
      .eq('org_id', input.orgId)
      .like('job_card_no', 'JC-%')
      .order('job_card_no', { ascending: false })
      .limit(1);

    const lastNum = lastJc?.[0]?.job_card_no
      ? parseInt(lastJc[0].job_card_no.replace('JC-', '')) || 0
      : 0;
    const jobCardNo = `JC-${String(lastNum + 1).padStart(5, '0')}`;

    // Get BOM
    const { data: bom } = await supabase
      .from('boms')
      .select('id, transfer_material_against')
      .eq('id', wo.bomId)
      .single();

    // Calculate expected time
    const timeInMinutes = woOp.fixedTime
      ? woOp.timeInMinutes
      : woOp.timeInMinutes * (input.forQuantity / (woOp.batchSize || 1));

    // Calculate expected end date
    let expectedEndDate = input.expectedStartDate
      ? new Date(input.expectedStartDate)
      : undefined;
    if (expectedEndDate) {
      expectedEndDate.setMinutes(expectedEndDate.getMinutes() + timeInMinutes);
    }

    // Get total completed qty from other job cards
    const { data: existingJcs } = await supabase
      .from('job_cards')
      .select('completed_qty')
      .eq('work_order_id', input.workOrderId)
      .eq('operation_id', input.operationId)
      .not('status', 'eq', 'Cancelled');

    const totalCompletedQty = (existingJcs || []).reduce(
      (sum, jc) => sum + parseFloat(jc.completed_qty || '0'),
      0
    );

    // Insert job card
    const { data: jc, error: jcError } = await supabase
      .from('job_cards')
      .insert({
        org_id: input.orgId,
        job_card_no: jobCardNo,
        status: 'Open',
        work_order_id: input.workOrderId,
        bom_id: bom?.id,
        operation_id: input.operationId,
        sequence: woOp.sequence,
        item_id: wo.itemId,
        workstation_id: input.workstationId || woOp.workstationId,
        for_quantity: input.forQuantity,
        completed_qty: 0,
        process_loss_qty: 0,
        total_completed_qty: totalCompletedQty,
        time_in_minutes: timeInMinutes,
        total_time_in_minutes: 0,
        expected_start_date: input.expectedStartDate?.toISOString(),
        expected_end_date: expectedEndDate?.toISOString(),
        employee_id: input.employeeId,
        hour_rate: woOp.hourRate,
        batch_size: woOp.batchSize,
        is_subcontracted: input.isSubcontracted,
        is_corrective: input.isCorrective,
        wip_warehouse_id: input.wipWarehouseId || wo.wipWarehouseId,
        quality_inspection_required: false,
        project_id: input.projectId || wo.projectId,
        cost_center_id: input.costCenterId || wo.costCenterId,
        remarks: input.remarks,
      })
      .select()
      .single();

    if (jcError) {
      throw new ManufacturingError(`Failed to create job card: ${jcError.message}`);
    }

    // Create job card items (materials for this operation) if BOM uses Job Card transfer
    if (bom?.transfer_material_against === 'Job Card') {
      const woItems = wo.items.filter(i => i.operationId === input.operationId);

      for (const woItem of woItems) {
        const itemQty = woItem.requiredQty * (input.forQuantity / wo.quantity);

        await supabase.from('job_card_items').insert({
          job_card_id: jc.id,
          work_order_item_id: woItem.id,
          item_id: woItem.itemId,
          description: woItem.description,
          required_qty: itemQty,
          transferred_qty: 0,
          uom_id: woItem.uomId,
          source_warehouse_id: woItem.sourceWarehouseId || wo.sourceWarehouseId,
          allow_alternative_item: woItem.allowAlternativeItem,
        });
      }
    }

    return this.getById(jc.id);
  }

  /**
   * Get job card by ID with all details
   */
  static async getById(id: string): Promise<JobCardWithDetails> {
    const supabase = await createClient();

    const { data: jc, error } = await supabase
      .from('job_cards')
      .select(`
        *,
        work_orders (work_order_no),
        operations (operation_name),
        workstations (workstation_name),
        items!job_cards_item_id_fkey (item_code, item_name),
        employees (employee_name)
      `)
      .eq('id', id)
      .single();

    if (error || !jc) {
      throw new ManufacturingError(`Job card not found: ${id}`);
    }

    // Get time logs
    const { data: timeLogs } = await supabase
      .from('job_card_time_logs')
      .select(`
        *,
        employees (employee_name)
      `)
      .eq('job_card_id', id)
      .order('from_time');

    // Get items
    const { data: items } = await supabase
      .from('job_card_items')
      .select(`
        *,
        items (item_code, item_name),
        uoms (uom_name)
      `)
      .eq('job_card_id', id);

    // Get scrap items
    const { data: scrapItems } = await supabase
      .from('job_card_scrap_items')
      .select(`
        *,
        items (item_code, item_name)
      `)
      .eq('job_card_id', id);

    return {
      ...this.mapDbToJobCard(jc),
      workOrderNo: jc.work_orders?.work_order_no,
      operationName: jc.operations?.operation_name,
      workstationName: jc.workstations?.workstation_name,
      itemCode: jc.items?.item_code,
      itemName: jc.items?.item_name,
      employeeName: jc.employees?.employee_name,
      timeLogs: (timeLogs || []).map(t => ({
        ...this.mapDbToTimeLog(t),
        employeeName: t.employees?.employee_name,
      })),
      items: (items || []).map(i => ({
        ...this.mapDbToJobCardItem(i),
        itemCode: i.items?.item_code,
        itemName: i.items?.item_name,
        uomName: i.uoms?.uom_name,
      })),
      scrapItems: (scrapItems || []).map(s => ({
        ...this.mapDbToJobCardScrapItem(s),
        itemCode: s.items?.item_code,
        itemName: s.items?.item_name,
      })),
    };
  }

  /**
   * List job cards
   */
  static async list(filters: {
    orgId: string;
    workOrderId?: string;
    operationId?: string;
    workstationId?: string;
    employeeId?: string;
    status?: JobCardStatus;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<JobCardSummary[]> {
    const supabase = await createClient();

    let query = supabase
      .from('job_cards')
      .select(`
        id, job_card_no, status, for_quantity, completed_qty,
        expected_start_date, expected_end_date,
        work_orders (work_order_no),
        operations (operation_name),
        workstations (workstation_name),
        items!job_cards_item_id_fkey (item_code)
      `)
      .eq('org_id', filters.orgId)
      .order('job_card_no', { ascending: false });

    if (filters.workOrderId) {
      query = query.eq('work_order_id', filters.workOrderId);
    }

    if (filters.operationId) {
      query = query.eq('operation_id', filters.operationId);
    }

    if (filters.workstationId) {
      query = query.eq('workstation_id', filters.workstationId);
    }

    if (filters.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fromDate) {
      query = query.gte('expected_start_date', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      query = query.lte('expected_start_date', filters.toDate.toISOString());
    }

    if (filters.search) {
      query = query.or(`job_card_no.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new ManufacturingError(`Failed to list job cards: ${error.message}`);
    }

    return (data || []).map(jc => ({
      id: jc.id,
      jobCardNo: jc.job_card_no,
      status: jc.status,
      workOrderNo: jc.work_orders?.work_order_no || '',
      operationName: jc.operations?.operation_name || '',
      workstationName: jc.workstations?.workstation_name,
      itemCode: jc.items?.item_code || '',
      forQuantity: parseFloat(jc.for_quantity) || 0,
      completedQty: parseFloat(jc.completed_qty) || 0,
      expectedStartDate: jc.expected_start_date ? new Date(jc.expected_start_date) : undefined,
      expectedEndDate: jc.expected_end_date ? new Date(jc.expected_end_date) : undefined,
    }));
  }

  /**
   * Start job card (begin working)
   */
  static async start(input: JobCardStart): Promise<JobCardWithDetails> {
    const supabase = await createClient();

    const jc = await this.getById(input.jobCardId);

    if (!['Open', 'Material Transferred'].includes(jc.status)) {
      throw new ManufacturingError('Cannot start this job card');
    }

    // Check if materials are transferred (if required)
    if (jc.items.length > 0) {
      const pendingTransfer = jc.items.some(i => i.requiredQty > i.transferredQty);
      if (pendingTransfer) {
        throw new ManufacturingError('Transfer materials before starting');
      }
    }

    // Create time log entry
    await supabase.from('job_card_time_logs').insert({
      job_card_id: jc.id,
      from_time: input.startTime.toISOString(),
      time_in_minutes: 0,
      completed_qty: 0,
      employee_id: input.employeeId || jc.employeeId,
      operating_cost: 0,
      is_completed: false,
    });

    // Update job card status
    await supabase
      .from('job_cards')
      .update({
        status: 'Work in Progress',
        actual_start_date: input.startTime.toISOString(),
        employee_id: input.employeeId || jc.employeeId,
      })
      .eq('id', jc.id);

    // Update work order operation status
    await supabase
      .from('work_order_operations')
      .update({
        status: 'Work in Progress',
        actual_start_time: input.startTime.toISOString(),
      })
      .eq('work_order_id', jc.workOrderId)
      .eq('operation_id', jc.operationId);

    return this.getById(jc.id);
  }

  /**
   * Complete job card time log
   */
  static async completeTimeLog(input: CreateTimeLog): Promise<JobCardTimeLog> {
    const supabase = await createClient();

    const jc = await this.getById(input.jobCardId);

    if (jc.status !== 'Work in Progress') {
      throw new ManufacturingError('Job card is not in progress');
    }

    // Find open time log or create new one
    const { data: openLog } = await supabase
      .from('job_card_time_logs')
      .select('*')
      .eq('job_card_id', jc.id)
      .is('to_time', null)
      .single();

    if (openLog && input.toTime) {
      // Complete existing log
      const fromTime = new Date(openLog.from_time);
      const toTime = input.toTime;
      const timeInMinutes = Math.round((toTime.getTime() - fromTime.getTime()) / 60000);
      const operatingCost = (timeInMinutes / 60) * jc.hourRate;

      const { data: updatedLog, error } = await supabase
        .from('job_card_time_logs')
        .update({
          to_time: toTime.toISOString(),
          time_in_minutes: timeInMinutes,
          completed_qty: input.completedQty,
          employee_id: input.employeeId || openLog.employee_id,
          operating_cost: operatingCost,
          remarks: input.remarks,
          is_completed: true,
        })
        .eq('id', openLog.id)
        .select()
        .single();

      if (error) {
        throw new ManufacturingError(`Failed to update time log: ${error.message}`);
      }

      // Update job card totals
      await this.updateJobCardTotals(jc.id);

      return this.mapDbToTimeLog(updatedLog);
    } else {
      // Create new completed log
      const timeInMinutes = input.toTime
        ? Math.round((input.toTime.getTime() - input.fromTime.getTime()) / 60000)
        : 0;
      const operatingCost = (timeInMinutes / 60) * jc.hourRate;

      const { data: newLog, error } = await supabase
        .from('job_card_time_logs')
        .insert({
          job_card_id: jc.id,
          from_time: input.fromTime.toISOString(),
          to_time: input.toTime?.toISOString(),
          time_in_minutes: timeInMinutes,
          completed_qty: input.completedQty,
          employee_id: input.employeeId || jc.employeeId,
          operating_cost: operatingCost,
          remarks: input.remarks,
          is_completed: !!input.toTime,
        })
        .select()
        .single();

      if (error) {
        throw new ManufacturingError(`Failed to create time log: ${error.message}`);
      }

      // Update job card totals
      await this.updateJobCardTotals(jc.id);

      return this.mapDbToTimeLog(newLog);
    }
  }

  /**
   * Complete job card
   */
  static async complete(input: JobCardComplete): Promise<JobCardWithDetails> {
    const supabase = await createClient();

    const jc = await this.getById(input.jobCardId);

    if (jc.status !== 'Work in Progress') {
      throw new ManufacturingError('Job card is not in progress');
    }

    // Complete any open time logs
    const { data: openLogs } = await supabase
      .from('job_card_time_logs')
      .select('id, from_time')
      .eq('job_card_id', jc.id)
      .is('to_time', null);

    for (const log of openLogs || []) {
      await this.completeTimeLog({
        jobCardId: jc.id,
        fromTime: new Date(log.from_time),
        toTime: input.endTime,
        completedQty: input.completedQty,
      });
    }

    // Add scrap items if any
    if (input.scrapItems && input.scrapItems.length > 0) {
      for (const scrap of input.scrapItems) {
        await supabase.from('job_card_scrap_items').insert({
          job_card_id: jc.id,
          item_id: scrap.itemId,
          stock_qty: scrap.qty,
        });
      }
    }

    // Update job card
    const newCompletedQty = jc.completedQty + input.completedQty;
    const newProcessLossQty = jc.processLossQty + (input.processLossQty || 0);

    await supabase
      .from('job_cards')
      .update({
        status: 'Completed',
        completed_qty: newCompletedQty,
        process_loss_qty: newProcessLossQty,
        actual_end_date: input.endTime.toISOString(),
      })
      .eq('id', jc.id);

    // Update work order operation
    await supabase.rpc('update_work_order_operation_from_job_card', {
      p_work_order_id: jc.workOrderId,
      p_operation_id: jc.operationId,
    });

    return this.getById(jc.id);
  }

  /**
   * Transfer materials to job card
   */
  static async transferMaterials(input: JobCardMaterialTransfer): Promise<void> {
    const supabase = await createClient();

    const jc = await this.getById(input.jobCardId);

    if (!['Open', 'Work in Progress'].includes(jc.status)) {
      throw new ManufacturingError('Cannot transfer materials to this job card');
    }

    // Create stock entry for material transfer
    await StockEntryService.create({
      orgId: jc.orgId,
      stockEntryType: 'Material Transfer for Manufacture',
      postingDate: input.postingDate,
      postingTime: input.postingTime,
      workOrderId: jc.workOrderId,
      jobCardId: jc.id,
      items: input.items.map(i => ({
        itemId: i.itemId,
        qty: i.qty,
        sourceWarehouseId: i.sourceWarehouseId,
        targetWarehouseId: jc.wipWarehouseId,
      })),
    });

    // Update job card items
    for (const item of input.items) {
      await supabase.rpc('update_job_card_item_transferred', {
        p_job_card_id: jc.id,
        p_item_id: item.itemId,
        p_qty: item.qty,
      });
    }

    // Update status if not started
    if (jc.status === 'Open') {
      await supabase
        .from('job_cards')
        .update({ status: 'Material Transferred' })
        .eq('id', jc.id);
    }
  }

  /**
   * Put job card on hold
   */
  static async hold(id: string, reason?: string): Promise<void> {
    const supabase = await createClient();

    const jc = await this.getById(id);

    if (jc.status !== 'Work in Progress') {
      throw new ManufacturingError('Only in-progress job cards can be put on hold');
    }

    // Complete any open time logs
    const { data: openLogs } = await supabase
      .from('job_card_time_logs')
      .select('id, from_time')
      .eq('job_card_id', id)
      .is('to_time', null);

    for (const log of openLogs || []) {
      await supabase
        .from('job_card_time_logs')
        .update({
          to_time: new Date().toISOString(),
          time_in_minutes: Math.round(
            (Date.now() - new Date(log.from_time).getTime()) / 60000
          ),
          is_completed: true,
        })
        .eq('id', log.id);
    }

    await supabase
      .from('job_cards')
      .update({
        status: 'On Hold',
        remarks: reason || jc.remarks,
      })
      .eq('id', id);

    await this.updateJobCardTotals(id);
  }

  /**
   * Resume job card from hold
   */
  static async resume(id: string): Promise<void> {
    const supabase = await createClient();

    const jc = await this.getById(id);

    if (jc.status !== 'On Hold') {
      throw new ManufacturingError('Only on-hold job cards can be resumed');
    }

    // Create new time log
    await supabase.from('job_card_time_logs').insert({
      job_card_id: id,
      from_time: new Date().toISOString(),
      time_in_minutes: 0,
      completed_qty: 0,
      employee_id: jc.employeeId,
      operating_cost: 0,
      is_completed: false,
    });

    await supabase
      .from('job_cards')
      .update({ status: 'Work in Progress' })
      .eq('id', id);
  }

  /**
   * Cancel job card
   */
  static async cancel(id: string): Promise<void> {
    const supabase = await createClient();

    const jc = await this.getById(id);

    if (jc.status === 'Cancelled') {
      throw new ManufacturingError('Job card is already cancelled');
    }

    if (jc.status === 'Completed') {
      throw new ManufacturingError('Cannot cancel completed job card');
    }

    await supabase
      .from('job_cards')
      .update({ status: 'Cancelled' })
      .eq('id', id);
  }

  /**
   * Get workstation timeline
   */
  static async getWorkstationTimeline(
    workstationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<WorkstationTimelineEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('job_cards')
      .select(`
        id, job_card_no, status, for_quantity,
        actual_start_date, actual_end_date,
        expected_start_date, expected_end_date,
        work_orders (work_order_no),
        operations (operation_name),
        items!job_cards_item_id_fkey (item_name),
        employees (employee_name)
      `)
      .eq('workstation_id', workstationId)
      .not('status', 'eq', 'Cancelled')
      .or(
        `expected_start_date.gte.${fromDate.toISOString()},actual_start_date.gte.${fromDate.toISOString()}`
      )
      .or(
        `expected_end_date.lte.${toDate.toISOString()},actual_end_date.lte.${toDate.toISOString()}`
      )
      .order('expected_start_date');

    if (error) {
      throw new ManufacturingError(`Failed to get timeline: ${error.message}`);
    }

    return (data || []).map(jc => ({
      jobCardId: jc.id,
      jobCardNo: jc.job_card_no,
      workOrderNo: jc.work_orders?.work_order_no || '',
      operationName: jc.operations?.operation_name || '',
      itemName: jc.items?.item_name || '',
      quantity: parseFloat(jc.for_quantity) || 0,
      startTime: new Date(jc.actual_start_date || jc.expected_start_date),
      endTime: new Date(jc.actual_end_date || jc.expected_end_date),
      status: jc.status,
      employeeName: jc.employees?.employee_name,
    }));
  }

  /**
   * Get employee workload
   */
  static async getEmployeeWorkload(
    employeeId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<EmployeeWorkload> {
    const supabase = await createClient();

    let query = supabase
      .from('job_cards')
      .select(`
        id, job_card_no, status, for_quantity,
        expected_start_date, expected_end_date,
        total_time_in_minutes,
        operations (operation_name),
        items!job_cards_item_id_fkey (item_name)
      `)
      .eq('employee_id', employeeId)
      .not('status', 'in', '("Cancelled","Completed")');

    if (fromDate) {
      query = query.gte('expected_start_date', fromDate.toISOString());
    }

    if (toDate) {
      query = query.lte('expected_end_date', toDate.toISOString());
    }

    const { data: jcs, error } = await query.order('expected_start_date');

    if (error) {
      throw new ManufacturingError(`Failed to get workload: ${error.message}`);
    }

    // Get employee name
    const { data: employee } = await supabase
      .from('employees')
      .select('employee_name')
      .eq('id', employeeId)
      .single();

    const totalTimeMinutes = (jcs || []).reduce((sum, jc) => {
      return sum + (parseFloat(jc.total_time_in_minutes) || 0);
    }, 0);

    const completedTimeMinutes = (jcs || [])
      .filter(jc => jc.status === 'Completed')
      .reduce((sum, jc) => sum + (parseFloat(jc.total_time_in_minutes) || 0), 0);

    return {
      employeeId,
      employeeName: employee?.employee_name || '',
      jobCards: (jcs || []).map(jc => ({
        jobCardNo: jc.job_card_no,
        operationName: jc.operations?.operation_name || '',
        itemName: jc.items?.item_name || '',
        forQuantity: parseFloat(jc.for_quantity) || 0,
        expectedStart: jc.expected_start_date ? new Date(jc.expected_start_date) : undefined,
        expectedEnd: jc.expected_end_date ? new Date(jc.expected_end_date) : undefined,
        status: jc.status,
      })),
      totalTimeMinutes,
      completedTimeMinutes,
    };
  }

  /**
   * Update job card totals from time logs
   */
  private static async updateJobCardTotals(id: string): Promise<void> {
    const supabase = await createClient();

    const { data: timeLogs } = await supabase
      .from('job_card_time_logs')
      .select('time_in_minutes, completed_qty')
      .eq('job_card_id', id);

    const totalTimeInMinutes = (timeLogs || []).reduce(
      (sum, t) => sum + (parseFloat(t.time_in_minutes) || 0),
      0
    );

    const completedQty = (timeLogs || []).reduce(
      (sum, t) => sum + (parseFloat(t.completed_qty) || 0),
      0
    );

    await supabase
      .from('job_cards')
      .update({
        total_time_in_minutes: totalTimeInMinutes,
        completed_qty: completedQty,
      })
      .eq('id', id);
  }

  // Mapping functions
  private static mapDbToJobCard(row: any): JobCard {
    return {
      id: row.id,
      orgId: row.org_id,
      jobCardNo: row.job_card_no,
      status: row.status,
      workOrderId: row.work_order_id,
      bomId: row.bom_id,
      operationId: row.operation_id,
      sequence: row.sequence || 0,
      itemId: row.item_id,
      workstationId: row.workstation_id,
      forQuantity: parseFloat(row.for_quantity) || 0,
      completedQty: parseFloat(row.completed_qty) || 0,
      processLossQty: parseFloat(row.process_loss_qty) || 0,
      totalCompletedQty: parseFloat(row.total_completed_qty) || 0,
      timeInMinutes: parseFloat(row.time_in_minutes) || 0,
      totalTimeInMinutes: parseFloat(row.total_time_in_minutes) || 0,
      expectedStartDate: row.expected_start_date ? new Date(row.expected_start_date) : undefined,
      expectedEndDate: row.expected_end_date ? new Date(row.expected_end_date) : undefined,
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      employeeId: row.employee_id,
      hourRate: parseFloat(row.hour_rate) || 0,
      batchSize: parseFloat(row.batch_size) || 1,
      isSubcontracted: row.is_subcontracted ?? false,
      isCorrective: row.is_corrective ?? false,
      wipWarehouseId: row.wip_warehouse_id,
      qualityInspectionRequired: row.quality_inspection_required ?? false,
      qualityInspectionTemplate: row.quality_inspection_template,
      projectId: row.project_id,
      costCenterId: row.cost_center_id,
      remarks: row.remarks,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToTimeLog(row: any): JobCardTimeLog {
    return {
      id: row.id,
      jobCardId: row.job_card_id,
      fromTime: new Date(row.from_time),
      toTime: row.to_time ? new Date(row.to_time) : undefined,
      timeInMinutes: parseFloat(row.time_in_minutes) || 0,
      completedQty: parseFloat(row.completed_qty) || 0,
      employeeId: row.employee_id,
      operatingCost: parseFloat(row.operating_cost) || 0,
      remarks: row.remarks,
      isCompleted: row.is_completed ?? false,
    };
  }

  private static mapDbToJobCardItem(row: any): JobCardItem {
    return {
      id: row.id,
      jobCardId: row.job_card_id,
      workOrderItemId: row.work_order_item_id,
      itemId: row.item_id,
      description: row.description,
      requiredQty: parseFloat(row.required_qty) || 0,
      transferredQty: parseFloat(row.transferred_qty) || 0,
      uomId: row.uom_id,
      sourceWarehouseId: row.source_warehouse_id,
      allowAlternativeItem: row.allow_alternative_item ?? false,
    };
  }

  private static mapDbToJobCardScrapItem(row: any): JobCardScrapItem {
    return {
      id: row.id,
      jobCardId: row.job_card_id,
      itemId: row.item_id,
      description: row.description,
      stockQty: parseFloat(row.stock_qty) || 0,
      uomId: row.uom_id,
      stockUomId: row.stock_uom_id,
    };
  }
}
