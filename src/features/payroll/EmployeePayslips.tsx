import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dayflowDb } from '../../services/db';
import { Payslip, Employee } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  DollarSign,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const EmployeePayslips: React.FC = () => {
  const { currentEmployee } = useAuth();
  const { showToast } = useToast();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchPayslips = async () => {
    if (!currentEmployee) return;
    setIsLoading(true);
    const list = await dayflowDb.getPayslips(currentEmployee.employeeId);
    setPayslips(list);
    if (list.length > 0) {
      setSelectedPayslip(list[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPayslips();
  }, [currentEmployee]);

  const handlePrint = () => {
    window.print();
    showToast('Opening print dialog for payslip...', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Salary & Payslips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access itemized monthly compensation summaries, tax withholdings, and official payslips.
          </p>
        </div>

        {selectedPayslip && (
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Payslip</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading payslips...</div>
      ) : payslips.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No payslips generated yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Your monthly payslips will be published here once processed by HR.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Payslip Selector List (1 Col) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Select Pay Period
            </h2>
            {payslips.map((ps) => {
              const isSelected = selectedPayslip?.id === ps.id;
              return (
                <div
                  key={ps.id}
                  onClick={() => setSelectedPayslip(ps)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">{ps.month}</span>
                    <StatusBadge status={ps.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Net Paid:</span>
                    <span className="font-bold text-indigo-600 text-sm">
                      {formatCurrency(ps.netSalary, ps.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Payslip View (2 Cols) */}
          {selectedPayslip && (
            <div
              ref={printRef}
              className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none"
            >
              {/* Official Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <span className="font-black text-slate-900 text-lg">DAYFLOW TECHNOLOGIES INC.</span>
                  </div>
                  <p className="text-xs text-slate-400">100 Market St, San Francisco, CA 94105</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Payslip For
                  </span>
                  <span className="text-base font-black text-slate-900">{selectedPayslip.month}</span>
                </div>
              </div>

              {/* Employee & Pay Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Employee Name</span>
                  <span className="font-bold text-slate-900">{selectedPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Employee ID</span>
                  <span className="font-bold font-mono text-slate-900">
                    {selectedPayslip.employeeId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Department</span>
                  <span className="font-bold text-slate-900">{currentEmployee?.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Designation</span>
                  <span className="font-bold text-slate-900">{currentEmployee?.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Total Working Days</span>
                  <span className="font-bold text-slate-900">{selectedPayslip.workingDays}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Days Paid</span>
                  <span className="font-bold text-emerald-600">{selectedPayslip.paidDays}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Unpaid / LOP Days</span>
                  <span className="font-bold text-rose-600">{selectedPayslip.unpaidDays}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Pay Date</span>
                  <span className="font-bold text-slate-900">
                    {formatDate(selectedPayslip.paidAt || selectedPayslip.createdAt)}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Earnings
                    </span>
                    <span className="text-xs text-slate-400">Amount</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {selectedPayslip.earningsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(item.amount, selectedPayslip.currency)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                      <span>Total Gross Earnings</span>
                      <span className="text-emerald-600 font-mono">
                        {formatCurrency(selectedPayslip.grossSalary, selectedPayslip.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Deductions & Taxes
                    </span>
                    <span className="text-xs text-slate-400">Amount</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {selectedPayslip.deductionsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(item.amount, selectedPayslip.currency)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                      <span>Total Deductions</span>
                      <span className="text-rose-600 font-mono">
                        {formatCurrency(selectedPayslip.totalDeductions, selectedPayslip.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Card */}
              <div className="p-5 rounded-2xl bg-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
                    Net Take-Home Salary
                  </span>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    Directly deposited to your registered bank account.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black font-mono">
                    {formatCurrency(selectedPayslip.netSalary, selectedPayslip.currency)}
                  </span>
                </div>
              </div>

              {/* Signature lines for print */}
              <div className="pt-8 border-t border-slate-200 hidden print:grid grid-cols-2 gap-8 text-xs text-slate-500">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">Employer Signature & Seal</p>
                  <p>Dayflow Technologies Authorized Signatory</p>
                </div>
                <div className="border-t border-slate-400 pt-2 text-right">
                  <p className="font-bold text-slate-900">Employee Signature</p>
                  <p>{selectedPayslip.employeeName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
