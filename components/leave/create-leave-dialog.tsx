'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import type { LeaveType } from './types'
import type { Employee } from '@/lib/models/hr'

interface CreateLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  leaveTypes: LeaveType[];
  selectedEmployee: string;
  onSelectedEmployeeChange: (id: string) => void;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function CreateLeaveDialog({
  open,
  onOpenChange,
  employees,
  leaveTypes,
  selectedEmployee,
  onSelectedEmployeeChange,
  isPending,
  onSubmit,
}: CreateLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Leave Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Leave Application</DialogTitle>
          <DialogDescription>
            Submit a leave request for an employee.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee *</Label>
            <Select name="employeeId" value={selectedEmployee} onValueChange={onSelectedEmployeeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveTypeId">Leave Type *</Label>
            <Select name="leaveTypeId">
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.leave_type_name} {type.is_paid ? '(Paid)' : '(Unpaid)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date *</Label>
              <Input id="fromDate" name="fromDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date *</Label>
              <Input id="toDate" name="toDate" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" placeholder="Reason for leave..." />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
