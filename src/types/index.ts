export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserCredential {
  uid: string;
  loginId: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  employeeId: string;
  loginId?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
}

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'TERMINATED';

export interface BankDetails {
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  empCode?: string;
}

export interface Employee {
  id: string;
  uid: string;
  employeeId: string;
  loginId?: string;
  password?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  address?: string;
  nationality?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  dateOfJoining: string;
  company: string;
  department: string;
  designation: string;
  manager?: string;
  location: string;
  employmentStatus: EmploymentStatus;
  bankDetails?: BankDetails;
  aboutMe?: string;
  jobHighlights?: string;
  interests?: string;
  skills?: string[];
  certifications?: string[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'RESUME' | 'ID_PROOF' | 'CERTIFICATE' | 'OFFER_LETTER' | 'CONTRACT' | 'TAX_DOCUMENT' | 'MEDICAL_RECORD' | 'OTHER';
export type DocumentVisibility = 'ADMIN_ONLY' | 'EMPLOYEE_VISIBLE';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  documentType: DocumentType;
  storageUrl: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  visibility: DocumentVisibility;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'INCOMPLETE';
export type AttendanceSource = 'MANUAL' | 'WEB_CHECK_IN' | 'IMPORT' | 'DEVICE' | 'API';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string or HH:mm
  checkOut: string | null; // ISO string or HH:mm
  breakStart?: string | null;
  breakEnd?: string | null;
  totalBreakMinutes?: number;
  workHours: number; // in hours, e.g. 8.5
  extraHours: number; // overtime
  status: AttendanceStatus;
  attendanceSource: AttendanceSource;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveCode = 'PAID_TIME_OFF' | 'SICK_LEAVE' | 'UNPAID_LEAVE' | string;

export interface LeaveType {
  id: string;
  name: string;
  code: LeaveCode;
  description: string;
  annualAllocation?: number;
  defaultDays?: number;
  isPaid: boolean;
  requiresAttachment?: boolean;
  requiresApproval?: boolean;
  active?: boolean;
  color?: string;
  carryForwardLimit?: number;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDepartment?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  numberOfDays: number;
  isHalfDay?: boolean;
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  remarks?: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  appliedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryProfile {
  id: string;
  employeeId: string;
  monthlyWage: number;
  yearlyWage: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  workingDaysPerWeek: number;
  breakHours: number;
  createdAt: string;
  updatedAt: string;
}

export type ComponentCalculationMethod = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FORMULA';

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'ALLOWANCE' | 'BONUS';
  calculationMethod: ComponentCalculationMethod;
  value: number; // e.g. 50 (for 50%) or 2000 (fixed)
  percentageBase: 'MONTHLY_WAGE' | 'BASIC_SALARY';
  isEarning: boolean;
  isDeduction: boolean;
  active?: boolean;
  isTaxable?: boolean;
  description?: string;
}

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'GENERATED' | 'PAID' | 'FINALIZED';

export interface ComponentBreakdownItem {
  name: string;
  code?: string;
  amount: number;
  type?: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  currency: string;
  basicSalary: number;
  monthlyWage: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  earningsBreakdown: ComponentBreakdownItem[];
  deductionsBreakdown: ComponentBreakdownItem[];
  status: PayrollStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export type PayrollRecord = Payslip;

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: PayrollStatus;
  generatedAt: string;
  paidAt?: string;
}

export type RemovalReason =
  | 'RESIGNATION'
  | 'PERFORMANCE'
  | 'CONTRACT_TERMINATION'
  | 'RESTRUCTURING'
  | 'MUTUAL_AGREEMENT'
  | 'DISCIPLINARY'
  | 'OTHER';

export type RemovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface EmployeeRemovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeeDesignation: string;
  employeeEmail: string;
  reason: RemovalReason;
  reasonDetails: string;
  proposedEffectiveDate: string; // YYYY-MM-DD
  additionalNotes?: string;
  status: RemovalRequestStatus;
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: UserRole;
  requestedAt: string;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'PROFILE_UPDATED'
  | 'SALARY_UPDATED'
  | 'PAYSLIP_GENERATED'
  | 'ATTENDANCE_ALERT'
  | 'REMOVAL_REQUESTED'
  | 'REMOVAL_APPROVED'
  | 'REMOVAL_REJECTED'
  | 'ROLE_ASSIGNED'
  | 'SECURITY_ALERT'
  | 'CREDENTIAL_UPDATED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  recipientUserId?: string; // user uid or employeeId or 'ALL_ADMINS'
  recipientRole?: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityType?: 'LEAVE' | 'ATTENDANCE' | 'SALARY' | 'EMPLOYEE' | 'PAYROLL' | 'REMOVAL';
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string; // e.g. "EMPLOYEE_CREATED", "LEAVE_APPROVED", "SALARY_UPDATED"
  entityType: string; // "Employee", "LeaveRequest", "SalaryProfile", etc.
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  timestamp: string;
  ipAddress?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string; // Employee ID or name
  location?: string;
  budget?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  id?: string;
  companyName: string;
  companyPrefix: string;
  companyLogoUrl?: string;
  workingDaysPerWeek: number;
  dailyWorkingHours?: number;
  standardShiftHours?: number;
  standardStartTime?: string;
  standardEndTime?: string;
  employeeIdFormat: 'PREFIX_NAME_YEAR_SEQ' | 'PREFIX_YEAR_SEQ' | 'PREFIX_SEQ' | 'NUMERIC_SEQ';
  defaultCurrency: string;
  publicSignupEnabled?: boolean;
  overtimeMultiplier?: number;
  fiscalYearStartMonth?: number;
  enableBiometricSync?: boolean;
  requireLeaveReason?: boolean;
}
