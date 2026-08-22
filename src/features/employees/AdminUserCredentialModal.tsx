import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Employee, UserRole, Department } from '../../types';
import {
  Shield,
  Key,
  Lock,
  User,
  Building,
  Briefcase,
  X,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminUserCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export const AdminUserCredentialModal: React.FC<AdminUserCredentialModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role: myRole } = useAuth();
  const { showToast } = useToast();

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');
  const [selectedDept, setSelectedDept] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [loginId, setLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('password @2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dayflowDb.getDepartments().then((depts) => {
        setAvailableDepartments(depts);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee) {
      if (employee.department.includes('Human')) {
        setSelectedRole('HR');
      } else if (employee.designation.toLowerCase().includes('admin') || employee.employeeId === 'DAYFLOW-AM2023-001') {
        setSelectedRole('ADMIN');
      } else {
        setSelectedRole('EMPLOYEE');
      }
      setSelectedDept(employee.department || 'Engineering');
      setDesignation(employee.designation || '');
      setLoginId(employee.loginId || employee.employeeId);
      setNewPassword(employee.password || 'password @2026');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleGenerateStandardLoginId = () => {
    const parts = employee.fullName.trim().split(' ');
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || 'Emp';
    const company = employee.company || 'Dayflow';
    const year = new Date().getFullYear();

    const gen = dayflowDb.generateStandardLoginId(company, firstName, lastName, year);
    setLoginId(gen);
    showToast(`Generated standard Login ID: ${gen}`, 'info');
  };

  const handleResetDefaultPassword = () => {
    setNewPassword('password @2026');
    showToast('Password reset to default: password @2026', 'info');
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
    showToast('Generated secure temporary password', 'info');
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Login ID: ${loginId}\nPassword: ${newPassword}`);
    showToast('Credentials copied to clipboard!', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) {
      showToast('Login ID cannot be empty', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('Password cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await dayflowDb.updateUserCredentials(
        employee.employeeId,
        {
          loginId: loginId.trim(),
          password: newPassword.trim(),
          role: selectedRole,
          department: selectedDept,
          designation: designation.trim(),
        },
        {
          id: currentUser?.uid || 'admin',
          name: currentEmployee?.fullName || 'Master Administrator',
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
      showToast(err.message || 'Failed to update credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
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
            <h2 className="text-lg font-bold text-slate-900">Admin User Management & Credentials</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign HR/Employee roles, edit or reset Login ID, and configure secure passwords.
            </p>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={
                employee.profilePictureUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
              }
              alt={employee.fullName}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</p>
              <p className="text-xs text-slate-500 truncate">
                {employee.designation} • {employee.department}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              {employee.employeeId}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Role Choice Cards */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Assign System Access Role <span className="text-indigo-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Employee */}
              <button
                type="button"
                onClick={() => setSelectedRole('EMPLOYEE')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'EMPLOYEE'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
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
                  Check-in, personal leaves & payslips
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
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20'
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
                  Approve leaves, manage directory & payroll
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
                  Master configuration, reset logins & roles
                </p>
              </button>
            </div>
          </div>

          {/* Login ID Section */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Login ID :-</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateStandardLoginId}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Format ID</span>
              </button>
            </div>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. Admin or OIJODO20240001"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            <p className="text-[10px] text-slate-500">
              Users can authenticate using this Login ID or their registered email address.
            </p>
          </div>

          {/* Password Management Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Password :-</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultPassword}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
                >
                  Reset to Default
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Randomize
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-20 py-2 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                required
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="p-1 text-indigo-600 hover:text-indigo-800"
                  title="Copy Login ID and Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Department & Designation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium text-xs focus:outline-hidden focus:border-indigo-500"
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Designation Title</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Staff Software Engineer"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy New Credentials</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Update Credentials'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
