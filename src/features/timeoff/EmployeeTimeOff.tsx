import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import { LeaveBalance, LeaveRequest, LeaveType } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  CalendarCheck,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const EmployeeTimeOff: React.FC = () => {
  const { currentEmployee, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState<LeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrHR = role === 'ADMIN' || role === 'HR';

  const fetchLeaveData = async () => {
    if (!currentEmployee) return;
    setIsLoading(true);
    const [balList, reqList] = await Promise.all([
      dayflowDb.getLeaveBalances(currentEmployee.employeeId, 2026),
      dayflowDb.getLeaveRequests(currentEmployee.employeeId),
    ]);
    setBalances(balList);
    setRequests(reqList);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaveData();
  }, [currentEmployee]);

  const handleCancelRequest = async () => {
    if (!leaveToCancel) return;

    // Set status to CANCELLED
    const updated: LeaveRequest = {
      ...leaveToCancel,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };

    // Revert pending count on balance
    const matchedBal = balances.find((b) => b.leaveTypeId === leaveToCancel.leaveTypeId);
    if (matchedBal) {
      const newPending = Math.max(0, matchedBal.pending - leaveToCancel.numberOfDays);
      await dayflowDb.saveLeaveBalance({
        ...matchedBal,
        pending: newPending,
      });
    }

    await dayflowDb.saveLeaveRequest(updated);
    showToast('Leave request cancelled', 'info');
    setLeaveToCancel(null);
    fetchLeaveData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Time Off & Leave Balances
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your available PTO, check application statuses, and request future leaves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdminOrHR && (
            <button
              type="button"
              onClick={() => navigate('/admin/time-off')}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>HR Leave Approvals Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((bal) => {
          const percentUsed = bal.allocated > 0 ? Math.round((bal.used / bal.allocated) * 100) : 0;
          return (
            <div
              key={bal.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 truncate">{bal.leaveTypeName}</span>
                  <span className="text-[11px] font-semibold text-slate-400">2026</span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-black text-indigo-600">{bal.remaining}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {bal.allocated} days left</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Used: {bal.used} d</span>
                {bal.pending > 0 && (
                  <span className="text-amber-600 font-bold">Pending: {bal.pending} d</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Request History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">My Leave Applications</h2>
          <span className="text-xs text-slate-400">{requests.length} Total Submissions</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading leave history...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-400 mt-0.5">You have not submitted any time-off requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Leave Type</th>
                  <th className="py-3.5 px-6">Start Date</th>
                  <th className="py-3.5 px-6">End Date</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Reason / Note</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Reviewer Comments</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{req.leaveTypeName}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">{formatDate(req.startDate)}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">{formatDate(req.endDate)}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800">
                        {req.numberOfDays} {req.numberOfDays === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate">{req.remarks || '—'}</td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 italic max-w-xs truncate">
                      {req.reviewComment ? `"${req.reviewComment}"` : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {req.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => setLeaveToCancel(req)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          fetchLeaveData();
        }}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!leaveToCancel}
        title="Cancel Leave Application?"
        message={`Are you sure you want to cancel your ${leaveToCancel?.numberOfDays} day(s) ${leaveToCancel?.leaveTypeName} request?`}
        confirmLabel="Yes, Cancel Request"
        confirmVariant="danger"
        onConfirm={handleCancelRequest}
        onCancel={() => setLeaveToCancel(null)}
      />
    </div>
  );
};
