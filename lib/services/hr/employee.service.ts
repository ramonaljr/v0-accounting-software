/**
 * Employee Service
 * Handles employee CRUD operations and related entities
 * Based on ERPNext's HR module
 */

import { createClient } from '@/lib/supabase/server';
import {
  Employee,
  EmployeeWithDetails,
  Department,
  Designation,
  Branch,
  EmployeeGrade,
  EmploymentType,
  EmployeeEducation,
  EmployeeWorkExperience,
  EmployeeDependent,
  CreateEmployee,
  CreateDepartment,
  CreateDesignation,
} from '@/lib/models/hr';

export class EmployeeService {
  // ==================== EMPLOYEE CRUD ====================

  /**
   * Create a new employee
   */
  async createEmployee(data: CreateEmployee): Promise<Employee> {
    const supabase = await createClient();

    // Generate employee number
    const employeeNo = await this.generateEmployeeNo(data.orgId);

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        org_id: data.orgId,
        employee_no: employeeNo,
        first_name: data.firstName,
        middle_name: data.middleName,
        last_name: data.lastName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        date_of_joining: data.dateOfJoining,
        // Organization
        department_id: data.departmentId,
        designation_id: data.designationId,
        branch_id: data.branchId,
        employment_type_id: data.employmentTypeId,
        grade_id: data.employeeGradeId,
        reports_to: data.reportsTo,
        // Contact
        personal_email: data.personalEmail,
        company_email: data.companyEmail,
        mobile_phone: data.mobileNo,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactNo,
        // Address
        current_address: data.currentAddress,
        permanent_address: data.permanentAddress,
        // Bank
        bank_name: data.bankName,
        bank_account_no: data.bankAccountNo,
        // PH Statutory
        tin_no: data.tinNo,
        sss_no: data.sssNo,
        philhealth_no: data.philhealthNo,
        pagibig_no: data.pagibigNo,
        // Tax
        tax_status: data.taxStatus || 'S',
        qualified_dependents: data.qualifiedDependents || 0,
        // Status
        status: 'Active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return this.mapEmployee(employee);
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string, orgId: string): Promise<EmployeeWithDetails | null> {
    const supabase = await createClient();

    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(*),
        designation:designations(*),
        branch:branches(*),
        employment_type:employment_types(*),
        employee_grade:employee_grades!grade_id(*),
        reports_to_employee:employees!employees_reports_to_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !employee) {
      return null;
    }

    // Get education, work experience, dependents
    const [education, workExperience, dependents] = await Promise.all([
      this.getEmployeeEducation(id),
      this.getEmployeeWorkExperience(id),
      this.getEmployeeDependents(id),
    ]);

    return {
      ...this.mapEmployee(employee),
      departmentName: employee.department?.department_name,
      designationName: employee.designation?.designation_name,
      branchName: employee.branch?.branch_name,
      employmentTypeName: employee.employment_type?.employment_type_name,
      employeeGradeName: employee.employee_grade?.grade_name,
      reportsToName: employee.reports_to_employee
        ? `${employee.reports_to_employee.first_name} ${employee.reports_to_employee.last_name}`
        : undefined,
      education,
      workExperience,
      dependents,
    };
  }

  /**
   * List employees with filters
   */
  async listEmployees(
    orgId: string,
    options?: {
      status?: string;
      departmentId?: string;
      designationId?: string;
      branchId?: string;
      employmentTypeId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ employees: Employee[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('employees')
      .select(`
        *,
        department:departments(department_name),
        designation:designations(designation_name),
        branch:branches(branch_name)
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.departmentId) {
      query = query.eq('department_id', options.departmentId);
    }
    if (options?.designationId) {
      query = query.eq('designation_id', options.designationId);
    }
    if (options?.branchId) {
      query = query.eq('branch_id', options.branchId);
    }
    if (options?.employmentTypeId) {
      query = query.eq('employment_type_id', options.employmentTypeId);
    }
    if (options?.search) {
      query = query.or(
        `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,employee_no.ilike.%${options.search}%`
      );
    }

    // Pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1).order('employee_no', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list employees: ${error.message}`);
    }

    const employees = (data || []).map((emp) => ({
      ...this.mapEmployee(emp),
      departmentName: emp.department?.department_name,
      designationName: emp.designation?.designation_name,
      branchName: emp.branch?.branch_name,
    }));

    return { employees, total: count || 0 };
  }

  /**
   * Update employee
   */
  async updateEmployee(
    id: string,
    orgId: string,
    data: Partial<CreateEmployee>
  ): Promise<Employee> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.middleName !== undefined) updateData.middle_name = data.middleName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
    if (data.dateOfJoining !== undefined) updateData.date_of_joining = data.dateOfJoining;
    if (data.departmentId !== undefined) updateData.department_id = data.departmentId;
    if (data.designationId !== undefined) updateData.designation_id = data.designationId;
    if (data.branchId !== undefined) updateData.branch_id = data.branchId;
    if (data.employmentTypeId !== undefined) updateData.employment_type_id = data.employmentTypeId;
    if (data.employeeGradeId !== undefined) updateData.grade_id = data.employeeGradeId;
    if (data.reportsTo !== undefined) updateData.reports_to = data.reportsTo;
    if (data.personalEmail !== undefined) updateData.personal_email = data.personalEmail;
    if (data.companyEmail !== undefined) updateData.company_email = data.companyEmail;
    if (data.mobileNo !== undefined) updateData.mobile_phone = data.mobileNo;
    if (data.emergencyContactName !== undefined) updateData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactNo !== undefined) updateData.emergency_contact_phone = data.emergencyContactNo;
    if (data.currentAddress !== undefined) updateData.current_address = data.currentAddress;
    if (data.permanentAddress !== undefined) updateData.permanent_address = data.permanentAddress;
    if (data.bankName !== undefined) updateData.bank_name = data.bankName;
    if (data.bankAccountNo !== undefined) updateData.bank_account_no = data.bankAccountNo;
    if (data.tinNo !== undefined) updateData.tin_no = data.tinNo;
    if (data.sssNo !== undefined) updateData.sss_no = data.sssNo;
    if (data.philhealthNo !== undefined) updateData.philhealth_no = data.philhealthNo;
    if (data.pagibigNo !== undefined) updateData.pagibig_no = data.pagibigNo;
    if (data.taxStatus !== undefined) updateData.tax_status = data.taxStatus;
    if (data.qualifiedDependents !== undefined) updateData.qualified_dependents = data.qualifiedDependents;

    updateData.updated_at = new Date().toISOString();

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update employee: ${error.message}`);
    }

    return this.mapEmployee(employee);
  }

  /**
   * Update employee status
   */
  async updateEmployeeStatus(
    id: string,
    orgId: string,
    status: string,
    relievingDate?: Date,
    reasonForLeaving?: string
  ): Promise<Employee> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Left' && relievingDate) {
      updateData.relieving_date = relievingDate;
      updateData.reason_for_leaving = reasonForLeaving;
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update employee status: ${error.message}`);
    }

    return this.mapEmployee(employee);
  }

  // ==================== EMPLOYEE EDUCATION ====================

  async getEmployeeEducation(employeeId: string): Promise<EmployeeEducation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_education')
      .select('*')
      .eq('employee_id', employeeId)
      .order('year_of_graduation', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map((edu) => ({
      id: edu.id,
      employeeId: edu.employee_id,
      school: edu.school_university,
      qualification: edu.qualification,
      level: edu.level,
      yearOfPassing: edu.year_of_graduation,
      classOrPercentage: edu.class_grade,
      majorSubject: edu.field_of_study,
      createdAt: new Date(edu.created_at),
    }));
  }

  async addEmployeeEducation(
    employeeId: string,
    education: Omit<EmployeeEducation, 'id' | 'employeeId' | 'createdAt'>
  ): Promise<EmployeeEducation> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_education')
      .insert({
        employee_id: employeeId,
        school_university: education.school,
        qualification: education.qualification,
        level: education.level,
        year_of_graduation: education.yearOfPassing,
        class_grade: education.classOrPercentage,
        field_of_study: education.majorSubject,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add education: ${error.message}`);
    }

    return {
      id: data.id,
      employeeId: data.employee_id,
      school: data.school_university,
      qualification: data.qualification,
      level: data.level,
      yearOfPassing: data.year_of_graduation,
      classOrPercentage: data.class_grade,
      majorSubject: data.field_of_study,
      createdAt: new Date(data.created_at),
    };
  }

  // ==================== EMPLOYEE WORK EXPERIENCE ====================

  async getEmployeeWorkExperience(employeeId: string): Promise<EmployeeWorkExperience[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_work_experience')
      .select('*')
      .eq('employee_id', employeeId)
      .order('from_date', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map((exp) => ({
      id: exp.id,
      employeeId: exp.employee_id,
      companyName: exp.company_name,
      designation: exp.designation,
      fromDate: new Date(exp.from_date),
      toDate: exp.to_date ? new Date(exp.to_date) : undefined,
      address: exp.address,
      salary: exp.salary,
      reasonForLeaving: exp.reason_for_leaving,
      createdAt: new Date(exp.created_at),
    }));
  }

  async addEmployeeWorkExperience(
    employeeId: string,
    experience: Omit<EmployeeWorkExperience, 'id' | 'employeeId' | 'createdAt'>
  ): Promise<EmployeeWorkExperience> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_work_experience')
      .insert({
        employee_id: employeeId,
        company_name: experience.companyName,
        designation: experience.designation,
        from_date: experience.fromDate,
        to_date: experience.toDate,
        address: experience.address,
        salary: experience.salary,
        reason_for_leaving: experience.reasonForLeaving,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add work experience: ${error.message}`);
    }

    return {
      id: data.id,
      employeeId: data.employee_id,
      companyName: data.company_name,
      designation: data.designation,
      fromDate: new Date(data.from_date),
      toDate: data.to_date ? new Date(data.to_date) : undefined,
      address: data.address,
      salary: data.salary,
      reasonForLeaving: data.reason_for_leaving,
      createdAt: new Date(data.created_at),
    };
  }

  // ==================== EMPLOYEE DEPENDENTS ====================

  async getEmployeeDependents(employeeId: string): Promise<EmployeeDependent[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_dependents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    return (data || []).map((dep) => ({
      id: dep.id,
      employeeId: dep.employee_id,
      dependentName: dep.dependent_name,
      relationship: dep.relationship,
      dateOfBirth: dep.date_of_birth ? new Date(dep.date_of_birth) : undefined,
      isBirQualified: dep.is_qualified_dependent,
      createdAt: new Date(dep.created_at),
    }));
  }

  async addEmployeeDependent(
    employeeId: string,
    dependent: Omit<EmployeeDependent, 'id' | 'employeeId' | 'createdAt'>
  ): Promise<EmployeeDependent> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_dependents')
      .insert({
        employee_id: employeeId,
        dependent_name: dependent.dependentName,
        relationship: dependent.relationship,
        date_of_birth: dependent.dateOfBirth,
        is_qualified_dependent: dependent.isBirQualified || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add dependent: ${error.message}`);
    }

    return {
      id: data.id,
      employeeId: data.employee_id,
      dependentName: data.dependent_name,
      relationship: data.relationship,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      isBirQualified: data.is_qualified_dependent,
      createdAt: new Date(data.created_at),
    };
  }

  // ==================== DEPARTMENTS ====================

  async createDepartment(data: CreateDepartment): Promise<Department> {
    const supabase = await createClient();

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        org_id: data.orgId,
        department_name: data.departmentName,
        parent_id: data.parentDepartmentId,
        company_id: data.companyId,
        is_group: data.isGroup || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }

    return {
      id: department.id,
      orgId: department.org_id,
      departmentName: department.department_name,
      parentDepartmentId: department.parent_id,
      companyId: department.company_id,
      isGroup: department.is_group,
      isActive: department.is_active,
      createdAt: new Date(department.created_at),
    };
  }

  async listDepartments(orgId: string): Promise<Department[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('department_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list departments: ${error.message}`);
    }

    return (data || []).map((dept) => ({
      id: dept.id,
      orgId: dept.org_id,
      departmentName: dept.department_name,
      parentDepartmentId: dept.parent_id,
      companyId: dept.company_id,
      isGroup: dept.is_group,
      isActive: dept.is_active,
      createdAt: new Date(dept.created_at),
    }));
  }

  // ==================== DESIGNATIONS ====================

  async createDesignation(data: CreateDesignation): Promise<Designation> {
    const supabase = await createClient();

    const { data: designation, error } = await supabase
      .from('designations')
      .insert({
        org_id: data.orgId,
        designation_name: data.designationName,
        description: data.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create designation: ${error.message}`);
    }

    return {
      id: designation.id,
      orgId: designation.org_id,
      designationName: designation.designation_name,
      description: designation.description,
      isActive: designation.is_active,
      createdAt: new Date(designation.created_at),
    };
  }

  async listDesignations(orgId: string): Promise<Designation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('designations')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('designation_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list designations: ${error.message}`);
    }

    return (data || []).map((des) => ({
      id: des.id,
      orgId: des.org_id,
      designationName: des.designation_name,
      description: des.description,
      isActive: des.is_active,
      createdAt: new Date(des.created_at),
    }));
  }

  // ==================== BRANCHES ====================

  async createBranch(
    orgId: string,
    branchName: string,
    address?: string
  ): Promise<Branch> {
    const supabase = await createClient();

    const { data: branch, error } = await supabase
      .from('branches')
      .insert({
        org_id: orgId,
        branch_name: branchName,
        address: address,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }

    return {
      id: branch.id,
      orgId: branch.org_id,
      branchName: branch.branch_name,
      address: branch.address,
      isActive: branch.is_active,
      createdAt: new Date(branch.created_at),
    };
  }

  async listBranches(orgId: string): Promise<Branch[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('branch_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }

    return (data || []).map((br) => ({
      id: br.id,
      orgId: br.org_id,
      branchName: br.branch_name,
      address: br.address,
      isActive: br.is_active,
      createdAt: new Date(br.created_at),
    }));
  }

  // ==================== EMPLOYEE GRADES ====================

  async createEmployeeGrade(
    orgId: string,
    gradeName: string,
    defaultBasePay?: number,
    defaultLeavePolicy?: string
  ): Promise<EmployeeGrade> {
    const supabase = await createClient();

    const { data: grade, error } = await supabase
      .from('employee_grades')
      .insert({
        org_id: orgId,
        grade_name: gradeName,
        default_base_pay: defaultBasePay,
        default_leave_policy_id: defaultLeavePolicy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employee grade: ${error.message}`);
    }

    return {
      id: grade.id,
      orgId: grade.org_id,
      gradeName: grade.grade_name,
      defaultBasePay: grade.default_base_pay,
      defaultLeavePolicyId: grade.default_leave_policy_id,
      isActive: grade.is_active,
      createdAt: new Date(grade.created_at),
    };
  }

  async listEmployeeGrades(orgId: string): Promise<EmployeeGrade[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_grades')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('grade_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list employee grades: ${error.message}`);
    }

    return (data || []).map((gr) => ({
      id: gr.id,
      orgId: gr.org_id,
      gradeName: gr.grade_name,
      defaultBasePay: gr.default_base_pay,
      defaultLeavePolicyId: gr.default_leave_policy_id,
      isActive: gr.is_active,
      createdAt: new Date(gr.created_at),
    }));
  }

  // ==================== EMPLOYMENT TYPES ====================

  async createEmploymentType(
    orgId: string,
    employmentTypeName: string
  ): Promise<EmploymentType> {
    const supabase = await createClient();

    const { data: type, error } = await supabase
      .from('employment_types')
      .insert({
        org_id: orgId,
        type_name: employmentTypeName,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employment type: ${error.message}`);
    }

    return {
      id: type.id,
      orgId: type.org_id,
      employmentTypeName: type.type_name,
      isActive: type.is_active,
      createdAt: new Date(type.created_at),
    };
  }

  async listEmploymentTypes(orgId: string): Promise<EmploymentType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employment_types')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('type_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list employment types: ${error.message}`);
    }

    return (data || []).map((et) => ({
      id: et.id,
      orgId: et.org_id,
      employmentTypeName: et.type_name,
      isActive: et.is_active,
      createdAt: new Date(et.created_at),
    }));
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate employee number
   */
  private async generateEmployeeNo(orgId: string): Promise<string> {
    const supabase = await createClient();

    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const nextNo = (count || 0) + 1;
    return `EMP-${String(nextNo).padStart(5, '0')}`;
  }

  /**
   * Map database employee to Employee interface
   */
  private mapEmployee(data: Record<string, unknown>): Employee {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      employeeNo: data.employee_no as string,
      firstName: data.first_name as string,
      middleName: data.middle_name as string | undefined,
      lastName: data.last_name as string,
      fullName: `${data.first_name} ${data.middle_name ? data.middle_name + ' ' : ''}${data.last_name}`,
      gender: data.gender as string,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth as string) : undefined,
      dateOfJoining: new Date(data.date_of_joining as string),
      // Organization
      departmentId: data.department_id as string | undefined,
      designationId: data.designation_id as string | undefined,
      branchId: data.branch_id as string | undefined,
      employmentTypeId: data.employment_type_id as string | undefined,
      employeeGradeId: data.grade_id as string | undefined,
      reportsTo: data.reports_to as string | undefined,
      // Contact
      personalEmail: data.personal_email as string | undefined,
      companyEmail: data.company_email as string | undefined,
      mobileNo: data.mobile_phone as string | undefined,
      emergencyContactName: data.emergency_contact_name as string | undefined,
      emergencyContactNo: data.emergency_contact_phone as string | undefined,
      // Address
      currentAddress: data.current_address as string | undefined,
      permanentAddress: data.permanent_address as string | undefined,
      // Bank
      bankName: data.bank_name as string | undefined,
      bankAccountNo: data.bank_account_no as string | undefined,
      // PH Statutory
      tinNo: data.tin_no as string | undefined,
      sssNo: data.sss_no as string | undefined,
      philhealthNo: data.philhealth_no as string | undefined,
      pagibigNo: data.pagibig_no as string | undefined,
      // Tax
      taxStatus: data.tax_status as string,
      qualifiedDependents: data.qualified_dependents as number,
      // Status
      status: data.status as string,
      relievingDate: data.relieving_date ? new Date(data.relieving_date as string) : undefined,
      reasonForLeaving: data.reason_for_leaving as string | undefined,
      // Metadata
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const employeeService = new EmployeeService();
