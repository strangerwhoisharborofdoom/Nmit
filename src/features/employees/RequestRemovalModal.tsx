import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Employee, RemovalReason, EmployeeRemovalRequest } from '../../types';
import {
  UserMinus,
  AlertTriangle,
  Calendar,
  FileText,
  X,
  CheckCircle2,
  ShieldAlert,
  Send,
} from 'lucide-react';

interface RequestRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export const RequestRemovalModal: React.FC<RequestRemovalModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState<RemovalReason>('RESIGNATION');
  const [reasonDetails, setReasonDetails] = useState('');
  const [proposedDate, setProposedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks default notice
    return d.toISOString().split('T')[0];
  });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [directTerminate, setDirectTerminate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !employee) return null;

  const isAdmin = role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reasonDetails.trim()) {
      showToast('Please provide a detailed justification for the removal request', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isAdmin && directTerminate) {
        // Direct termination by Admin
        await dayflowDb.terminateEmployee(
          employee.employeeId,
          `${reason}: ${reasonDetails}`,
          {
            id: currentUser?.uid || 'admin',
            name: currentEmployee?.fullName || 'Administrator',
            role: 'ADMIN',
          }
        );

        // Also add notification to user
        await dayflowDb.addNotification({
          id: `notif-${Date.now()}`,
          recipientUserId: employee.uid || employee.employeeId,
          type: 'REMOVAL_APPROVED',
          title: 'Employment Status Notice',
          message: `Your employment status at Dayflow has been updated to Terminated. Effective date: ${proposedDate}.`,
          read: false,
          createdAt: new Date().toISOString(),
          relatedEntityId: employee.employeeId,
          relatedEntityType: 'EMPLOYEE',
        });

        showToast(`Employee ${employee.fullName} has been terminated and deactivated.`, 'success');
      } else {
        // HR offboarding approval request submitted for Admin review
        const newRequest: EmployeeRemovalRequest = {
          id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          employeeDepartment: employee.department,
          employeeDesignation: employee.designation,
          employeeEmail: employee.email,
          reason,
          reasonDetails: reasonDetails.trim(),
          proposedEffectiveDate: proposedDate,
          additionalNotes: additionalNotes.trim() || undefined,
          status: 'PENDING',
          requestedByUid: currentUser?.uid || 'hr-user',
          requestedByName: currentEmployee?.fullName || 'HR Officer',
          requestedByRole: role || 'HR',
          requestedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await dayflowDb.saveRemovalRequest(newRequest);

        // Notify all Admins
        await dayflowDb.addNotification({
          id: `notif-rem-${Date.now()}`,
          recipientUserId: 'ALL_ADMINS',
          recipientRole: 'ADMIN',
          type: 'REMOVAL_REQUESTED',
          title: 'Employee Offboarding Approval Required',
          message: `${currentEmployee?.fullName || 'HR'} requested offboarding approval for ${employee.fullName} (${employee.designation}). Reason: ${reason.replace('_', ' ')}.`,
          read: false,
          createdAt: new Date().toISOString(),
          relatedEntityId: newRequest.id,
          relatedEntityType: 'REMOVAL',
        });

        await dayflowDb.logAudit({
          actorUserId: currentUser?.uid || 'hr',
          actorName: currentEmployee?.fullName || 'HR Officer',
          actorRole: role || 'HR',
          action: 'EMPLOYEE_REMOVAL_REQUESTED',
          entityType: 'EmployeeRemovalRequest',
          entityId: newRequest.id,
          newValue: `HR submitted removal approval request for ${employee.fullName} (${employee.employeeId}). Reason: ${reason}`,
        });

        showToast(
          `Offboarding request for ${employee.fullName} submitted to Administrator for approval.`,
          'success'
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit removal request', 'error');
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
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? 'Employee Offboarding & Removal' : 'Request Employee Offboarding'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Review offboarding details or initiate immediate employee separation.'
                : 'Submit an official offboarding approval request to the system Administrator.'}
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
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</p>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {employee.designation} • {employee.department}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Separation Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RemovalReason)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-900 font-medium focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="RESIGNATION">Voluntary Resignation</option>
              <option value="PERFORMANCE">Performance & Fit</option>
              <option value="CONTRACT_TERMINATION">End of Employment Contract</option>
              <option value="RESTRUCTURING">Organizational Restructuring</option>
              <option value="MUTUAL_AGREEMENT">Mutual Separation Agreement</option>
              <option value="DISCIPLINARY">Policy Violation / Disciplinary</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Proposed Last Working Day <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Reason Details & Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Provide context, notice period details, reason for departure, or specific circumstances..."
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Handover & Asset Clearance Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Laptop collection scheduled, knowledge transfer to engineering lead, final clearance form..."
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Admin Instant Termination Toggle */}
          {isAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="directTerminate"
                checked={directTerminate}
                onChange={(e) => setDirectTerminate(e.target.checked)}
                className="mt-0.5 rounded-md border-amber-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="directTerminate" className="text-amber-900 cursor-pointer">
                <span className="font-bold block">Execute Immediate Termination</span>
                <span className="text-[11px] text-amber-700/80">
                  As Administrator, you can bypass the request queue and immediately set this employee to Terminated and deactivate their credentials.
                </span>
              </label>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                This request will be routed to the <strong>System Administrator</strong> for final approval and offboarding authorization.
              </span>
            </div>
          )}

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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
            >
              {isAdmin && directTerminate ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Terminating...' : 'Confirm Termination'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Send Approval to Admin'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
