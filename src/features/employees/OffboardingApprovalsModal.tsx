import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { EmployeeRemovalRequest } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  UserMinus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  X,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Building,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OffboardingApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OffboardingApprovalsModal: React.FC<OffboardingApprovalsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const isAdmin = role === 'ADMIN';
  const [requests, setRequests] = useState<EmployeeRemovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  // Selected request for details or rejection modal
  const [selectedReq, setSelectedReq] = useState<EmployeeRemovalRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const data = await dayflowDb.getRemovalRequests();
    setRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingList = requests.filter((r) => r.status === 'PENDING');
  const approvedList = requests.filter((r) => r.status === 'APPROVED');
  const rejectedList = requests.filter((r) => r.status === 'REJECTED');

  const currentList =
    activeTab === 'PENDING'
      ? pendingList
      : activeTab === 'APPROVED'
      ? approvedList
      : rejectedList;

  const handleApprove = async (req: EmployeeRemovalRequest) => {
    if (!isAdmin) {
      showToast('Only System Administrators can approve offboarding requests.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update request status
      const updatedReq: EmployeeRemovalRequest = {
        ...req,
        status: 'APPROVED',
        reviewedByUid: currentUser?.uid || 'admin',
        reviewedByName: currentEmployee?.fullName || 'Administrator',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dayflowDb.saveRemovalRequest(updatedReq);

      // 2. Terminate the employee in directory
      await dayflowDb.terminateEmployee(
        req.employeeId,
        `Approved HR removal request: ${req.reason} - ${req.reasonDetails}`,
        {
          id: currentUser?.uid || 'admin',
          name: currentEmployee?.fullName || 'Administrator',
          role: 'ADMIN',
        }
      );

      // 3. Notify HR requester
      await dayflowDb.addNotification({
        id: `notif-hr-${Date.now()}`,
        recipientUserId: req.requestedByUid,
        type: 'REMOVAL_APPROVED',
        title: 'Offboarding Request Approved',
        message: `Admin ${currentEmployee?.fullName || 'Administrator'} approved the offboarding request for ${req.employeeName}. Employee status is now Terminated.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityId: req.id,
        relatedEntityType: 'REMOVAL',
      });

      // 4. Notify Employee
      await dayflowDb.addNotification({
        id: `notif-emp-${Date.now()}`,
        recipientUserId: req.employeeId,
        type: 'REMOVAL_APPROVED',
        title: 'Offboarding Confirmation',
        message: `Your offboarding has been confirmed by administration. Effective separation date: ${req.proposedEffectiveDate}.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityId: req.employeeId,
        relatedEntityType: 'EMPLOYEE',
      });

      showToast(`Approved offboarding for ${req.employeeName}. Personnel terminated.`, 'success');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await fetchRequests();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve offboarding', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectComment.trim()) {
      showToast('Please specify a rejection reason for HR', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedReq: EmployeeRemovalRequest = {
        ...selectedReq,
        status: 'REJECTED',
        reviewedByUid: currentUser?.uid || 'admin',
        reviewedByName: currentEmployee?.fullName || 'Administrator',
        reviewedAt: new Date().toISOString(),
        reviewComment: rejectComment.trim(),
        updatedAt: new Date().toISOString(),
      };
      await dayflowDb.saveRemovalRequest(updatedReq);

      // Notify HR requester
      await dayflowDb.addNotification({
        id: `notif-hr-rej-${Date.now()}`,
        recipientUserId: selectedReq.requestedByUid,
        type: 'REMOVAL_REJECTED',
        title: 'Offboarding Request Rejected',
        message: `Admin rejected the offboarding request for ${selectedReq.employeeName}. Reason: ${rejectComment.trim()}`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityId: selectedReq.id,
        relatedEntityType: 'REMOVAL',
      });

      await dayflowDb.logAudit({
        actorUserId: currentUser?.uid || 'admin',
        actorName: currentEmployee?.fullName || 'Administrator',
        actorRole: 'ADMIN',
        action: 'EMPLOYEE_REMOVAL_REJECTED',
        entityType: 'EmployeeRemovalRequest',
        entityId: selectedReq.id,
        newValue: `Admin rejected removal request for ${selectedReq.employeeName}. Reason: ${rejectComment.trim()}`,
      });

      showToast(`Rejected removal request for ${selectedReq.employeeName}`, 'info');
      setIsRejectModalOpen(false);
      setSelectedReq(null);
      setRejectComment('');
      await fetchRequests();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject removal request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">
                Employee Offboarding Approvals
              </h2>
              {pendingList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  {pendingList.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              HR officers submit separation requests; Administrators review, authorize, and finalize terminations.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Terminated ({approvedList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'REJECTED'
                ? 'bg-slate-100 text-slate-700'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedList.length})</span>
          </button>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading requests...</div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No {activeTab.toLowerCase()} requests</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'PENDING'
                ? 'All employee offboarding requests have been reviewed and processed.'
                : `No requests found in ${activeTab.toLowerCase()} state.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {currentList.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {req.employeeName?.[0] || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{req.employeeName}</h4>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                          {req.employeeId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {req.employeeDesignation} • {req.employeeDepartment}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : req.status === 'APPROVED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Terminated' : req.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Reason</span>
                    <span className="font-bold text-slate-900">
                      {req.reason.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">
                      Effective Last Working Date
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatDate(req.proposedEffectiveDate)}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-medium block text-[11px]">
                      Detailed Justification
                    </span>
                    <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {req.reasonDetails}
                    </p>
                  </div>
                  {req.additionalNotes && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">
                        Handover / Clearance Notes
                      </span>
                      <p className="text-slate-600 mt-0.5 text-[11px]">
                        {req.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata & Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  <div>
                    <span>Requested by </span>
                    <strong className="text-slate-700">{req.requestedByName}</strong>
                    <span> on {formatDate(req.requestedAt)}</span>
                    {req.reviewedByName && (
                      <span className="block mt-0.5 text-slate-500">
                        Reviewed by {req.reviewedByName} on {formatDate(req.reviewedAt || '')}
                        {req.reviewComment && ` • Comment: "${req.reviewComment}"`}
                      </span>
                    )}
                  </div>

                  {req.status === 'PENDING' && isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReq(req);
                          setIsRejectModalOpen(true);
                        }}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={isProcessing}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Terminate</span>
                      </button>
                    </div>
                  )}

                  {req.status === 'PENDING' && !isAdmin && (
                    <span className="text-amber-600 font-semibold italic text-xs">
                      Awaiting Administrator approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          <p className="text-xs text-slate-400">
            Approved offboarding actions automatically deactivate user authentication access.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Reject Reason Sub-modal */}
        {isRejectModalOpen && selectedReq && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Reject Offboarding Request
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Please provide feedback for {selectedReq.requestedByName} regarding why {selectedReq.employeeName}'s offboarding is declined.
              </p>
              <textarea
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g. Critical project handover incomplete; retention discussions ongoing with department head."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                required
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setSelectedReq(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
