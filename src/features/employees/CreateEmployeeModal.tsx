import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Employee, User, SalaryProfile, Department } from '../../types';
import { generateEmployeeId, generateTemporaryPassword } from '../../lib/utils';
import { X, UserPlus, Sparkles, Lock, Key, Copy, Check } from 'lucide-react';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');

  React.useEffect(() => {
    if (isOpen) {
      dayflowDb.getDepartments().then((depts) => {
        setAvailableDepartments(depts);
        if (depts.length > 0 && !depts.some((d) => d.name === department)) {
          setDepartment(depts[0].name);
        }
      });
    }
  }, [isOpen]);
  const [designation, setDesignation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [company, setCompany] = useState('Dayflow Technologies Inc.');
  const [manager, setManager] = useState('Alex Morgan');
  const [location, setLocation] = useState('San Francisco HQ');
  const [userRole, setUserRole] = useState<'EMPLOYEE' | 'HR' | 'ADMIN'>('EMPLOYEE');
  const [monthlyWage, setMonthlyWage] = useState<number>(85000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated credentials preview for the admin
  const [createdCredentials, setCreatedCredentials] = useState<{
    employeeId: string;
    tempPassword: string;
    email: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !designation) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const year = new Date(dateOfJoining).getFullYear() || 2026;
      const allEmployees = await dayflowDb.getEmployees();
      const seq = allEmployees.length + 1;
      const settings = await dayflowDb.getSettings();

      const newEmpId = generateEmployeeId(
        firstName,
        lastName,
        year,
        seq,
        settings.companyPrefix || 'DAYFLOW',
        settings.employeeIdFormat || 'PREFIX_NAME_YEAR_SEQ'
      );

      const tempPass = generateTemporaryPassword(12);
      const uid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        uid,
        employeeId: newEmpId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        profilePictureUrl: `https://images.unsplash.com/photo-${1534528741775 + (seq % 100)}?w=150&auto=format&fit=crop&q=80`,
        dateOfJoining,
        company,
        department,
        designation,
        manager,
        location,
        employmentStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newUser: User = {
        uid,
        employeeId: newEmpId,
        email: email.trim().toLowerCase(),
        role: userRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
      };

      const newSalaryProfile: SalaryProfile = {
        id: `sp-${newEmpId}`,
        employeeId: newEmpId,
        monthlyWage: Number(monthlyWage) || 85000,
        yearlyWage: (Number(monthlyWage) || 85000) * 12,
        currency: settings.defaultCurrency || 'INR',
        effectiveFrom: dateOfJoining,
        workingDaysPerWeek: settings.workingDaysPerWeek || 5,
        breakHours: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save employee, user, and initial salary profile
      await dayflowDb.saveEmployee(newEmployee, {
        id: currentUser?.uid || 'admin',
        name: currentEmployee?.fullName || 'HR Admin',
        role: role || 'ADMIN',
      });

      await dayflowDb.saveSalaryProfile(newSalaryProfile);

      // Seed leave balances for new employee
      await dayflowDb.getLeaveBalances(newEmpId, year);

      setCreatedCredentials({
        employeeId: newEmpId,
        tempPassword: tempPass,
        email: newEmployee.email,
      });

      showToast(`Employee ${newEmployee.fullName} created successfully!`, 'success');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create employee', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `Dayflow HRMS Credentials:\nEmployee ID: ${createdCredentials.employeeId}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Provision New Employee</h2>
              <p className="text-xs text-slate-500">
                Register employee details, configure salary structure, and generate system ID.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdCredentials ? (
          /* Success Screen with Credentials */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Employee Created Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                The employee profile, leave balances, and salary structure are active. Share these initial credentials with the employee.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-bold text-slate-900">{createdCredentials.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-bold text-slate-900">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Temporary Password:</span>
                <span className="font-bold text-indigo-600">{createdCredentials.tempPassword}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Creation Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Rachel"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Green"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rachel.green@dayflow.local"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
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
                      <option value="Product & Design">Product & Design</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Operations & Sales">Operations & Sales</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Joining
                </label>
                <input
                  type="date"
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco HQ / Remote"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager / Supervisor
                </label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="EMPLOYEE">Employee (Self-Service)</option>
                  <option value="HR">HR Officer</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Base Wage (₹)
                </label>
                <input
                  type="number"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(Number(e.target.value))}
                  placeholder="85000"
                  min="0"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Provision Employee</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
