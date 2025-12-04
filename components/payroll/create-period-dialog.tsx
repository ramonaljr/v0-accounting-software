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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Loader2 } from 'lucide-react'

interface CreatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function CreatePeriodDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: CreatePeriodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          New Period
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Payroll Period</DialogTitle>
          <DialogDescription>
            Define a new payroll period for your organization.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodName">Period Name *</Label>
            <Input id="periodName" name="periodName" placeholder="e.g., January 2025" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payrollFrequency">Frequency *</Label>
            <Select name="payrollFrequency" defaultValue="Semi-Monthly">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
                <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Period
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
