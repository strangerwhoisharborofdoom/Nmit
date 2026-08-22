import { UserRole } from '../types';

export type PermissionAction =
  | 'view_all_employees'
  | 'create_employee'
  | 'edit_employee_all'
  | 'edit_employee_profile_personal'
  | 'delete_employee'
  | 'view_all_attendance'
  | 'manage_attendance'
  | 'web_check_in_out'
  | 'apply_leave'
  | 'approve_reject_leave'
  | 'manage_leave_balances'
  | 'view_own_salary'
  | 'manage_salary_structures'
  | 'generate_payroll'
  | 'view_reports'
  | 'manage_system_settings'
  | 'view_audit_logs'
  | 'manage_documents';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  ADMIN: [
    'view_all_employees',
    'create_employee',
    'edit_employee_all',
    'edit_employee_profile_personal',
    'delete_employee',
    'view_all_attendance',
    'manage_attendance',
    'web_check_in_out',
    'apply_leave',
    'approve_reject_leave',
    'manage_leave_balances',
    'view_own_salary',
    'manage_salary_structures',
    'generate_payroll',
    'view_reports',
    'manage_system_settings',
    'view_audit_logs',
    'manage_documents',
  ],
  HR: [
    'view_all_employees',
    'create_employee',
    'edit_employee_all',
    'edit_employee_profile_personal',
    'view_all_attendance',
    'manage_attendance',
    'web_check_in_out',
    'apply_leave',
    'approve_reject_leave',
    'manage_leave_balances',
    'view_own_salary',
    'manage_salary_structures',
    'generate_payroll',
    'view_reports',
    'view_audit_logs',
    'manage_documents',
  ],
  EMPLOYEE: [
    'edit_employee_profile_personal',
    'web_check_in_out',
    'apply_leave',
    'view_own_salary',
    'manage_documents',
  ],
};

export function hasPermission(role: UserRole | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(action) : false;
}

export function isAdminOrHR(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'HR';
}
