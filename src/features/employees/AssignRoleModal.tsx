import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Employee, UserRole, Department } from '../../types';
import {
  Shield,
  UserCheck,
  Building,
  Briefcase,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role: myRole } = useAuth();
  const { showToast } = useToast();

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (!employee) return 'EMPLOYEE';
    if (employee.department.includes('Human')) return 'HR';
    return 'EMPLOYEE';
  });
  const [selectedDept, setSelectedDept] = useState(employee?.department || 'Engineering');
  const [designation, setDesignation] = useState(employee?.designation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dayflowDb.getDepartments().then((depts) => {
        setAvailableDepartments(depts);
      });
    }
  }, [isOpen]);

  // Sync state when employee changes
  React.useEffect(() => {
    if (employee) {
      if (employee.department.includes('Human')) {
        setSelectedRole('HR');
      } else {
        setSelectedRole('EMPLOYEE');
      }
      setSelectedDept(employee.department);
      setDesignation(employee.designation);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) {
      showToast('Please specify a designation / job title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await dayflowDb.assignUserRole(
        employee.employeeId,
        selectedRole,
        selectedDept,
        designation.trim(),
        {
          id: currentUser?.uid || 'admin',
          name: currentEmployee?.fullName || 'Administrator',
          role: myRole || 'ADMIN',
        }
      );

      if (res.success) {
        showToast(res.message, 'success');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        onSuccess();
        onClose();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assign Role & System Authority</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators can configure system roles, promote to HR Officer, and assign departments.
            </p>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 flex items-center gap-3.5">
          <img
            src={
              employee.profilePictureUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            }
            alt={employee.fullName}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-2xs"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</p>
            <p className="text-xs text-slate-500 truncate">
              Current: {employee.designation} • {employee.department}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Role Choice Cards */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Select System Access Role <span className="text-indigo-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Employee */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('EMPLOYEE');
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'EMPLOYEE'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-slate-900 text-xs">Employee</span>
                  {selectedRole === 'EMPLOYEE' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Self-service portal, check-in, leaves & salary
                </p>
              </button>

              {/* HR */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('HR');
                  if (!selectedDept.includes('Human')) {
                    setSelectedDept('Human Resources');
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'HR'
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-purple-900 text-xs">HR Officer</span>
                  {selectedRole === 'HR' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Workforce oversight, payroll, offboarding requests
                </p>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'ADMIN'
                    ? 'border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`font-bold text-xs ${
                      selectedRole === 'ADMIN' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Administrator
                  </span>
                  {selectedRole === 'ADMIN' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p
                  className={`text-[10px] leading-tight ${
                    selectedRole === 'ADMIN' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Full master access, role assignment & approvals
                </p>
              </button>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Assigned Department <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableDepartments.length > 0 ? (
                  availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Operations & Sales">Operations & Sales</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Designation Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Designation / Job Title <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior HR Specialist, Tech Lead, Staff Accountant"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          {/* Role summary notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-indigo-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Permission Breakdown for {selectedRole}:</span>
            </p>
            <p className="text-indigo-800/90 leading-relaxed">
              {selectedRole === 'ADMIN' &&
                'Can assign system roles, approve HR employee removal requests, manage compensation formulas, inspect complete audit logs, and configure company settings.'}
              {selectedRole === 'HR' &&
                'Can view workforce directory, review employee time-off, calculate and generate payroll batches, and submit employee offboarding approval requests to the Admin.'}
              {selectedRole === 'EMPLOYEE' &&
                'Can perform self check-in/out, request leave days, view their personal monthly salary slips, and edit permitted profile information.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Role...' : 'Confirm Role Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
