import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import { calculateEmployeePayroll } from '../../services/payrollCalculator';
import {
  Employee,
  SalaryProfile,
  SalaryComponent,
  Payslip,
  PayrollRun,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  DollarSign,
  Play,
  CheckCircle2,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

export const AdminPayroll: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'run' | 'components' | 'history'>('run');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryProfiles, setSalaryProfiles] = useState<SalaryProfile[]>([]);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [existingPayslips, setExistingPayslips] = useState<Payslip[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Component Edit Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Partial<SalaryComponent>>({
    name: '',
    code: '',
    type: 'ALLOWANCE',
    calculationMethod: 'PERCENTAGE',
    value: 10,
    percentageBase: 'BASIC_SALARY',
    isTaxable: true,
    isEarning: true,
    isDeduction: false,
  });

  const loadData = async () => {
    setIsLoading(true);
    const [empList, spList, compList, psList] = await Promise.all([
      dayflowDb.getEmployees(),
      dayflowDb.getSalaryProfiles(),
      dayflowDb.getSalaryComponents(),
      dayflowDb.getPayslips(),
    ]);

    setEmployees(empList.filter((e) => e.employmentStatus === 'ACTIVE'));
    setSalaryProfiles(spList);
    setComponents(compList);
    setExistingPayslips(psList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute calculated preview for each employee for selectedMonth
  const previewData = employees.map((emp) => {
    const sp = salaryProfiles.find((s) => s.employeeId === emp.employeeId) || {
      id: `sp-${emp.employeeId}`,
      employeeId: emp.employeeId,
      monthlyWage: 85000,
      yearlyWage: 1020000,
      currency: 'INR',
      effectiveFrom: emp.dateOfJoining,
      workingDaysPerWeek: 5,
      breakHours: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate computed payroll item
    const calc = calculateEmployeePayroll(emp, sp, components, {
      month: selectedMonth,
      workingDays: 22,
      presentDays: 22,
      leaveDays: 0,
      unpaidDays: 0,
    });

    const existing = existingPayslips.find(
      (p) => p.employeeId === emp.employeeId && p.month === selectedMonth
    );

    return {
      employee: emp,
      salaryProfile: sp,
      calc,
      existingPayslip: existing || null,
    };
  });

  // Aggregated totals
  const totalGross = previewData.reduce((sum, item) => sum + item.calc.grossSalary, 0);
  const totalDeductions = previewData.reduce((sum, item) => sum + item.calc.totalDeductions, 0);
  const totalNet = previewData.reduce((sum, item) => sum + item.calc.netSalary, 0);

  const handleGeneratePayrollRun = async () => {
    setIsProcessing(true);
    try {
      const newPayslips: Payslip[] = previewData.map(({ employee, calc, salaryProfile }) => ({
        id: `ps-${employee.employeeId}-${selectedMonth.replace(/\s+/g, '-')}`,
        employeeId: employee.employeeId,
        employeeName: employee.fullName,
        month: selectedMonth,
        year: 2026,
        workingDays: 22,
        paidDays: 22,
        unpaidDays: 0,
        currency: salaryProfile.currency || 'INR',
        basicSalary: calc.basicSalary,
        monthlyWage: salaryProfile.monthlyWage,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        earningsBreakdown: calc.earnings,
        deductionsBreakdown: calc.deductions,
        status: 'GENERATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await dayflowDb.savePayslipsBatch(newPayslips);

      // Audit Log
      await dayflowDb.logAudit({
        actorUserId: currentUser?.uid || 'admin',
        actorName: currentEmployee?.fullName || 'HR Admin',
        actorRole: role || 'ADMIN',
        action: 'PAYROLL_GENERATED',
        entityType: 'PayrollRun',
        entityId: selectedMonth,
        newValue: `Generated ${newPayslips.length} payslips for ${selectedMonth}. Total Net Payout: ${formatCurrency(totalNet, 'INR')}`,
      });

      // Notify all employees
      for (const emp of employees) {
        await dayflowDb.addNotification({
          id: `notif-${Date.now()}-${emp.employeeId}`,
          recipientUserId: emp.employeeId,
          type: 'PAYSLIP_GENERATED',
          title: 'Payslip Available',
          message: `Your payslip for ${selectedMonth} is now published and ready to download.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      showToast(`Payroll for ${selectedMonth} processed successfully!`, 'success');
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to process payroll', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    setIsProcessing(true);
    const updated = existingPayslips
      .filter((p) => p.month === selectedMonth)
      .map((p) => ({
        ...p,
        status: 'PAID' as const,
        paidAt: new Date().toISOString(),
      }));

    await dayflowDb.savePayslipsBatch(updated);
    showToast(`All ${updated.length} payslips marked as PAID / Disbursed`, 'success');
    setIsProcessing(false);
    loadData();
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp.name || !editingComp.code) {
      showToast('Please fill all required component fields', 'error');
      return;
    }

    const comp: SalaryComponent = {
      id: editingComp.id || `sc-${editingComp.code?.toLowerCase()}`,
      name: editingComp.name,
      code: editingComp.code.toUpperCase(),
      type: editingComp.type || 'ALLOWANCE',
      calculationMethod: editingComp.calculationMethod || 'PERCENTAGE',
      value: Number(editingComp.value) || 0,
      percentageBase: editingComp.percentageBase || 'BASIC_SALARY',
      isTaxable: editingComp.isTaxable ?? true,
      isEarning: editingComp.isEarning ?? true,
      isDeduction: editingComp.isDeduction ?? false,
    };

    await dayflowDb.saveSalaryComponent(comp);
    showToast(`Salary component ${comp.name} saved successfully`, 'success');
    setIsCompModalOpen(false);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Enterprise Payroll Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Run automated batch payroll, configure salary components, and distribute payslips.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('run')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'run'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Run Payroll
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'components'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Salary Components
          </button>
        </div>
      </div>

      {/* 1. RUN PAYROLL TAB */}
      {activeTab === 'run' && (
        <div className="space-y-6">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Headcount
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {employees.length}
              </span>
              <p className="text-xs text-slate-400 mt-1">Eligible for payroll</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Gross Earnings
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {formatCurrency(totalGross)}
              </span>
              <p className="text-xs text-slate-400 mt-1">Before deductions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Deductions / Taxes
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600">
                {formatCurrency(totalDeductions)}
              </span>
              <p className="text-xs text-slate-400 mt-1">PF, Tax, Withholdings</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Net Disbursable Payout
              </span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                {formatCurrency(totalNet)}
              </span>
              <p className="text-xs text-slate-400 mt-1">Bank transfer total</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700">Pay Period:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden"
              >
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleGeneratePayrollRun}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Process & Publish Batch</span>
              </button>

              <button
                type="button"
                onClick={handleBulkMarkPaid}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark All as Paid</span>
              </button>
            </div>
          </div>

          {/* Detailed Batch Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Monthly Base</th>
                    <th className="py-3.5 px-6">Gross Salary</th>
                    <th className="py-3.5 px-6">Deductions</th>
                    <th className="py-3.5 px-6">Net Take-Home</th>
                    <th className="py-3.5 px-6">Batch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map(({ employee, calc, salaryProfile, existingPayslip }) => (
                    <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              employee.profilePictureUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt={employee.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{employee.fullName}</p>
                            <p className="text-[10px] font-mono text-slate-400">{employee.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">{employee.department}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-900">
                        {formatCurrency(salaryProfile.monthlyWage, salaryProfile.currency)}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-semibold text-emerald-600">
                        {formatCurrency(calc.grossSalary, salaryProfile.currency)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-rose-600">
                        - {formatCurrency(calc.totalDeductions, salaryProfile.currency)}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-black text-indigo-600 text-sm">
                        {formatCurrency(calc.netSalary, salaryProfile.currency)}
                      </td>
                      <td className="py-3.5 px-6">
                        {existingPayslip ? (
                          <StatusBadge status={existingPayslip.status} size="sm" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Draft Preview
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALARY COMPONENTS CONFIGURATION TAB */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Configured Salary Structure</h2>
              <p className="text-xs text-slate-500">
                Define the computational formulas for allowances, employer benefits, and tax deductions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingComp({
                  name: '',
                  code: '',
                  type: 'ALLOWANCE',
                  calculationMethod: 'PERCENTAGE',
                  value: 10,
                  percentageBase: 'BASIC_SALARY',
                  isTaxable: true,
                  isEarning: true,
                  isDeduction: false,
                });
                setIsCompModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Component</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {components.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {comp.code}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        comp.isEarning && 'bg-emerald-50 text-emerald-700',
                        comp.isDeduction && 'bg-rose-50 text-rose-700'
                      )}
                    >
                      {comp.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{comp.name}</h3>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-bold text-slate-900">{comp.calculationMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rate / Amount:</span>
                      <span className="font-bold text-indigo-600">
                        {comp.calculationMethod === 'PERCENTAGE'
                          ? `${comp.value}% of ${comp.percentageBase.replace('_', ' ')}`
                          : `₹${comp.value.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComp(comp);
                      setIsCompModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Formula</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingComp.id ? 'Edit Component' : 'Add Salary Component'}
            </h3>
            <form onSubmit={handleSaveComponent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Component Name</label>
                <input
                  type="text"
                  value={editingComp.name}
                  onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })}
                  placeholder="e.g. Travel Allowance"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Component Code</label>
                <input
                  type="text"
                  value={editingComp.code}
                  onChange={(e) => setEditingComp({ ...editingComp, code: e.target.value })}
                  placeholder="e.g. TA"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingComp.isEarning ? 'EARNING' : 'DEDUCTION'}
                    onChange={(e) =>
                      setEditingComp({
                        ...editingComp,
                        isEarning: e.target.value === 'EARNING',
                        isDeduction: e.target.value === 'DEDUCTION',
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="EARNING">Earning (+)</option>
                    <option value="DEDUCTION">Deduction (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Method</label>
                  <select
                    value={editingComp.calculationMethod}
                    onChange={(e) =>
                      setEditingComp({
                        ...editingComp,
                        calculationMethod: e.target.value as any,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Value / Rate</label>
                <input
                  type="number"
                  value={editingComp.value}
                  onChange={(e) =>
                    setEditingComp({ ...editingComp, value: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              {editingComp.calculationMethod === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Calculate Percentage Of
                  </label>
                  <select
                    value={editingComp.percentageBase}
                    onChange={(e) =>
                      setEditingComp({ ...editingComp, percentageBase: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="BASIC_SALARY">Basic Salary</option>
                    <option value="MONTHLY_WAGE">Gross Monthly Wage</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
