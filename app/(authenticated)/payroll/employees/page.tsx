'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users, Search, Loader2, UserPlus, Building2 } from 'lucide-react';
import { listEmployees, createEmployee, listDepartments, listDesignations } from '@/lib/actions/hr';
import type { Employee, Department, Designation } from '@/lib/models/hr';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Stats
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const newHiresCount = employees.filter(e => {
    if (!e.dateOfJoining) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(e.dateOfJoining) >= thirtyDaysAgo;
  }).length;

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empResult, deptResult, desigResult] = await Promise.all([
          listEmployees({ status: statusFilter || undefined, search: searchQuery || undefined }),
          listDepartments(),
          listDesignations(),
        ]);

        if (empResult.success && empResult.data) {
          const data = empResult.data as { employees?: Employee[]; total?: number };
          setEmployees(data.employees || []);
          setTotal(data.total || 0);
        }
        if (deptResult.success && deptResult.data) {
          setDepartments(deptResult.data as Department[]);
        }
        if (desigResult.success && desigResult.data) {
          setDesignations(desigResult.data as Designation[]);
        }
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter, searchQuery]);

  // Handle form submission
  async function handleCreateEmployee(formData: FormData) {
    startTransition(async () => {
      const data = Object.fromEntries(formData.entries());
      const result = await createEmployee(data);

      if (result.success) {
        setIsDialogOpen(false);
        // Reload employees
        const empResult = await listEmployees();
        if (empResult.success && empResult.data) {
          setEmployees(empResult.data.employees || []);
          setTotal(empResult.data.total || 0);
        }
      } else {
        alert(result.error || 'Failed to create employee');
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage employee records and payroll details</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter employee details to add them to the payroll system.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateEmployee} className="space-y-4">
              <input type="hidden" name="orgId" value="00000000-0000-0000-0000-000000000000" />

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Personal Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                    <Input id="dateOfJoining" name="dateOfJoining" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select name="departmentId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="designationId">Designation</Label>
                    <Select name="designationId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map(desig => (
                          <SelectItem key={desig.id} value={desig.id}>
                            {desig.designationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    <Input id="personalEmail" name="personalEmail" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input id="companyEmail" name="companyEmail" type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input id="mobileNo" name="mobileNo" />
                </div>
              </div>

              {/* Government IDs (PH) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Government IDs (Philippines)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tinNo">TIN</Label>
                    <Input id="tinNo" name="tinNo" placeholder="XXX-XXX-XXX-XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sssNo">SSS Number</Label>
                    <Input id="sssNo" name="sssNo" placeholder="XX-XXXXXXX-X" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="philhealthNo">PhilHealth Number</Label>
                    <Input id="philhealthNo" name="philhealthNo" placeholder="XX-XXXXXXXXX-X" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pagibigNo">Pag-IBIG Number</Label>
                    <Input id="pagibigNo" name="pagibigNo" placeholder="XXXX-XXXX-XXXX" />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxStatus">Tax Status</Label>
                    <Select name="taxStatus" defaultValue="S">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">Single (S)</SelectItem>
                        <SelectItem value="ME">Married (ME)</SelectItem>
                        <SelectItem value="ME1">Married 1 Dep (ME1)</SelectItem>
                        <SelectItem value="ME2">Married 2 Dep (ME2)</SelectItem>
                        <SelectItem value="ME3">Married 3 Dep (ME3)</SelectItem>
                        <SelectItem value="ME4">Married 4 Dep (ME4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifiedDependents">Qualified Dependents</Label>
                    <Input
                      id="qualifiedDependents"
                      name="qualifiedDependents"
                      type="number"
                      min="0"
                      max="4"
                      defaultValue="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Employee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Employees</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Full & part-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">All statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>New Hires</CardDescription>
            <CardTitle className="text-2xl">{newHiresCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Directory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Directory
          </CardTitle>
          <CardDescription>Employee information and payroll settings</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Left">Left</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No employees added yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Add Your First Employee
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.fullName}</div>
                          <div className="text-sm text-gray-500">{employee.companyEmail || employee.personalEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{employee.employeeNo}</TableCell>
                      <TableCell>{(employee as any).departmentName || '-'}</TableCell>
                      <TableCell>{(employee as any).designationName || '-'}</TableCell>
                      <TableCell>
                        {new Date(employee.dateOfJoining).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === 'Active'
                              ? 'default'
                              : employee.status === 'Left'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
