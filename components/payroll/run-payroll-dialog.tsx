'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Play, Loader2 } from 'lucide-react'
import type { Employee } from '@/lib/models/hr'

interface RunPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: string[];
  onSelectedEmployeesChange: (ids: string[]) => void;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function RunPayrollDialog({
  open,
  onOpenChange,
  employees,
  selectedEmployees,
  onSelectedEmployeesChange,
  isPending,
  onSubmit,
}: RunPayrollDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Play className="h-4 w-4 mr-2" />
          Run Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
          <DialogDescription>
            Process payroll for selected employees. This will calculate earnings, deductions, and taxes.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Period Start *</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Period End *</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postingDate">Posting Date *</Label>
              <Input id="postingDate" name="postingDate" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Employees</Label>
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === employees.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectedEmployeesChange(employees.map(emp => emp.id));
                    } else {
                      onSelectedEmployeesChange([]);
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm font-medium">Select All ({employees.length} employees)</span>
              </div>
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedEmployeesChange([...selectedEmployees, emp.id]);
                      } else {
                        onSelectedEmployeesChange(selectedEmployees.filter(id => id !== emp.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{emp.fullName}</span>
                  <span className="text-xs text-gray-500">({emp.employeeNo})</span>
                </div>
              ))}
              {employees.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No active employees found</p>
              )}
            </div>
            <p className="text-xs text-gray-500">{selectedEmployees.length} employees selected</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || selectedEmployees.length === 0}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Run Payroll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
