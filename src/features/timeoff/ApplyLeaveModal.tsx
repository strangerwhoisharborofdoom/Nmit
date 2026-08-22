import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { LeaveType, LeaveBalance, LeaveRequest } from '../../types';
import { calculateWorkingDays } from '../../lib/utils';
import { X, Calendar, AlertCircle, Sparkles, Clock } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = 2026;

  useEffect(() => {
    if (!isOpen || !currentEmployee) return;

    const loadBalances = async () => {
      const [types, balances] = await Promise.all([
        dayflowDb.getLeaveTypes(),
        dayflowDb.getLeaveBalances(currentEmployee.employeeId, currentYear),
      ]);
      setLeaveTypes(types);
      setLeaveBalances(balances);
      if (types.length > 0) {
        setSelectedTypeId(types[0].id);
      }
    };

    loadBalances();
  }, [isOpen, currentEmployee]);

  if (!isOpen) return null;

  // Selected balance calculation
  const selectedType = leaveTypes.find((t) => t.id === selectedTypeId);
  const selectedBalance = leaveBalances.find((b) => b.leaveTypeId === selectedTypeId);

  // Compute number of days requested
  let calculatedDays = 0;
  if (startDate && endDate) {
    if (startDate <= endDate) {
      if (isHalfDay) {
        calculatedDays = 0.5;
      } else {
        calculatedDays = calculateWorkingDays(startDate, endDate);
      }
    }
  }

  const remainingAvailable = selectedBalance?.remaining ?? 0;
  const isInsufficient = selectedType?.isPaid && calculatedDays > remainingAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !selectedType) return;

    if (!startDate || !endDate) {
      showToast('Please select start and end dates', 'error');
      return;
    }

    if (startDate > endDate) {
      showToast('End date cannot be earlier than start date', 'error');
      return;
    }

    if (calculatedDays <= 0) {
      showToast('Selected date range contains 0 working days', 'error');
      return;
    }

    if (isInsufficient) {
      showToast(
        `Insufficient leave balance. You have ${remainingAvailable} days remaining for ${selectedType.name}`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newLeaveRequest: LeaveRequest = {
        id: `leave-${Date.now()}`,
        employeeId: currentEmployee.employeeId,
        employeeName: currentEmployee.fullName,
        employeeDepartment: currentEmployee.department,
        leaveTypeId: selectedType.id,
        leaveTypeName: selectedType.name,
        startDate,
        endDate,
        numberOfDays: calculatedDays,
        isHalfDay,
        halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
        remarks,
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save leave request
      await dayflowDb.saveLeaveRequest(newLeaveRequest);

      // Update pending count in balance
      if (selectedBalance) {
        await dayflowDb.saveLeaveBalance({
          ...selectedBalance,
          pending: selectedBalance.pending + calculatedDays,
        });
      }

      // Notify Admins & HR
      await dayflowDb.addNotification({
        id: `notif-${Date.now()}`,
        recipientRole: 'HR',
        type: 'LEAVE_REQUESTED',
        title: 'New Time Off Request',
        message: `${currentEmployee.fullName} requested ${calculatedDays} day(s) of ${selectedType.name}.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityId: newLeaveRequest.id,
        relatedEntityType: 'LEAVE',
      });

      // Audit Log
      await dayflowDb.logAudit({
        actorUserId: currentUser?.uid || 'user',
        actorName: currentEmployee.fullName,
        actorRole: role || 'EMPLOYEE',
        action: 'LEAVE_REQUESTED',
        entityType: 'LeaveRequest',
        entityId: newLeaveRequest.id,
        newValue: `${calculatedDays} days of ${selectedType.name} from ${startDate} to ${endDate}`,
      });

      showToast('Leave request submitted successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Time Off</h2>
              <p className="text-xs text-slate-500">Submit a leave application for manager approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
              required
            >
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.isPaid ? '(Paid)' : '(Unpaid)'}
                </option>
              ))}
            </select>

            {/* Remaining Balance pill */}
            {selectedBalance && (
              <div className="mt-2 flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Available Balance:</span>
                <span className="font-bold text-indigo-600">
                  {selectedBalance.remaining} days remaining (Allocated: {selectedBalance.allocated})
                </span>
              </div>
            )}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Half Day checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="halfDayCheck"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="halfDayCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
              This is a Half Day request (0.5 days)
            </label>
          </div>

          {isHalfDay && (
            <div className="flex items-center gap-4 text-xs pl-6">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDayPeriod"
                  checked={halfDayPeriod === 'FIRST_HALF'}
                  onChange={() => setHalfDayPeriod('FIRST_HALF')}
                />
                <span>Morning (First Half)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDayPeriod"
                  checked={halfDayPeriod === 'SECOND_HALF'}
                  onChange={() => setHalfDayPeriod('SECOND_HALF')}
                />
                <span>Afternoon (Second Half)</span>
              </label>
            </div>
          )}

          {/* Computed Days Banner */}
          {calculatedDays > 0 && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                isInsufficient
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="font-semibold">
                Total Request: {calculatedDays} Working Day{calculatedDays === 1 ? '' : 's'}
              </span>
              {isInsufficient && (
                <span className="text-[11px] font-bold text-rose-600">Exceeds Balance!</span>
              )}
            </div>
          )}

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Annual family vacation or medical recovery..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficient}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
