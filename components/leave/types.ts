/**
 * Leave Component Types
 */

export interface LeaveType {
  id: string;
  leave_type_name: string;
  max_leaves_allowed: number;
  is_paid: boolean;
  is_carry_forward: boolean;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_no?: string;
  leave_type_id: string;
  leave_type_name?: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
  reason?: string;
  created_at: string;
}

export interface LeaveBalance {
  leave_type_id: string;
  leave_type_name: string;
  total_allocated: number;
  total_used: number;
  available: number;
}

export type LeaveStatus = 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
