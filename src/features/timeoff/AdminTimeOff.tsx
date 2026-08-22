import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import { LeaveRequest, LeaveType, Employee, LeaveBalance } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Settings,
  Plus,
  Edit2,
  FileCheck,
  Building,
  UserCheck,
  Eye,
  Shield,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

export const AdminTimeOff: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'policy'>('pending');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeBalances, setEmployeeBalances] = useState<Record<string, LeaveBalance[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters for pending tab
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingDept, setPendingDept] = useState('ALL');

  // Filters for history tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Detail / Approval / Reject modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'VIEW' | 'APPROVE' | 'REJECT' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<Partial<LeaveType>>({
    name: '',
    code: '',
    defaultDays: 10,
    isPaid: true,
    color: '#6366f1',
    description: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    const [reqs, types, emps] = await Promise.all([
      dayflowDb.getLeaveRequests(),
      dayflowDb.getLeaveTypes(),
      dayflowDb.getEmployees(),
    ]);
    setLeaveRequests(reqs);
    setLeaveTypes(types);
    setEmployees(emps);

    // Fetch leave balances for all unique employee IDs who have pending or recent requests
    const uniqueEmpIds = Array.from(new Set(reqs.map((r) => r.employeeId)));
    const balanceMap: Record<string, LeaveBalance[]> = {};
    await Promise.all(
      uniqueEmpIds.map(async (empId) => {
        const bal = await dayflowDb.getLeaveBalances(empId, 2026);
        balanceMap[empId] = bal;
      })
    );
    setEmployeeBalances(balanceMap);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  const pendingLeaves = leaveRequests.filter((r) => {
    if (r.status !== 'PENDING') return false;
    const matchesSearch =
      r.employeeName.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      r.leaveTypeName.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(pendingSearch.toLowerCase()));
    const matchesDept = pendingDept === 'ALL' || r.employeeDepartment === pendingDept;
    return matchesSearch && matchesDept;
  });

  const filteredHistory = leaveRequests.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leaveTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || r.employeeDepartment === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleApprove = async (req: LeaveRequest) => {
    setIsProcessing(true);
    const reviewerTitle = currentEmployee?.fullName 
      ? `${currentEmployee.fullName} (${role === 'HR' ? 'HR Officer' : 'Admin'})`
      : role === 'HR' ? 'HR Officer' : 'Administrator';

    const updated: LeaveRequest = {
      ...req,
      status: 'APPROVED',
      reviewedBy: currentUser?.uid,
      reviewedByName: reviewerTitle,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update leave balance
    const balances = await dayflowDb.getLeaveBalances(req.employeeId, 2026);
    const matchedBal = balances.find((b) => b.leaveTypeId === req.leaveTypeId);
    if (matchedBal) {
      const newUsed = matchedBal.used + req.numberOfDays;
      const newPending = Math.max(0, matchedBal.pending - req.numberOfDays);
      const newRem = Math.max(0, matchedBal.allocated - newUsed);
      await dayflowDb.saveLeaveBalance({
        ...matchedBal,
        used: newUsed,
        pending: newPending,
        remaining: newRem,
      });
    }

    await dayflowDb.saveLeaveRequest(updated);
    await dayflowDb.addNotification({
      id: `notif-${Date.now()}`,
      recipientUserId: req.employeeId,
      type: 'LEAVE_APPROVED',
      title: 'Time Off Approved',
      message: `Your request for ${req.leaveTypeName} (${req.numberOfDays} days) has been approved by ${reviewerTitle}.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedEntityId: req.id,
      relatedEntityType: 'LEAVE',
    });

    await dayflowDb.logAudit({
      actorUserId: currentUser?.uid || 'admin',
      actorName: currentEmployee?.fullName || (role === 'HR' ? 'HR Officer' : 'Admin'),
      actorRole: role || 'HR',
      action: 'LEAVE_APPROVED',
      entityType: 'LeaveRequest',
      entityId: req.id,
      newValue: `Approved ${req.numberOfDays} days of ${req.leaveTypeName} for ${req.employeeName}`,
    });

    setIsProcessing(false);
    setSelectedLeave(null);
    setActionType(null);
    showToast(`Leave request for ${req.employeeName} approved successfully!`, 'success');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    loadData();
  };

  const handleReject = async () => {
    if (!selectedLeave) return;
    if (!rejectComment.trim()) {
      showToast('Please provide a reason for rejecting the leave request', 'error');
      return;
    }

    setIsProcessing(true);
    const reviewerTitle = currentEmployee?.fullName 
      ? `${currentEmployee.fullName} (${role === 'HR' ? 'HR Officer' : 'Admin'})`
      : role === 'HR' ? 'HR Officer' : 'Administrator';

    const updated: LeaveRequest = {
      ...selectedLeave,
      status: 'REJECTED',
      reviewedBy: currentUser?.uid,
      reviewedByName: reviewerTitle,
      reviewedAt: new Date().toISOString(),
      reviewComment: rejectComment,
      updatedAt: new Date().toISOString(),
    };

    // Revert pending count on balance
    const balances = await dayflowDb.getLeaveBalances(selectedLeave.employeeId, 2026);
    const matchedBal = balances.find((b) => b.leaveTypeId === selectedLeave.leaveTypeId);
    if (matchedBal) {
      const newPending = Math.max(0, matchedBal.pending - selectedLeave.numberOfDays);
      await dayflowDb.saveLeaveBalance({
        ...matchedBal,
        pending: newPending,
      });
    }

    await dayflowDb.saveLeaveRequest(updated);
    await dayflowDb.addNotification({
      id: `notif-${Date.now()}`,
      recipientUserId: selectedLeave.employeeId,
      type: 'LEAVE_REJECTED',
      title: 'Time Off Rejected',
      message: `Your request for ${selectedLeave.leaveTypeName} was rejected. Reason: ${rejectComment}`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedEntityId: selectedLeave.id,
      relatedEntityType: 'LEAVE',
    });

    await dayflowDb.logAudit({
      actorUserId: currentUser?.uid || 'admin',
      actorName: currentEmployee?.fullName || (role === 'HR' ? 'HR Officer' : 'Admin'),
      actorRole: role || 'HR',
      action: 'LEAVE_REJECTED',
      entityType: 'LeaveRequest',
      entityId: selectedLeave.id,
      newValue: `Rejected ${selectedLeave.numberOfDays} days for ${selectedLeave.employeeName}. Reason: ${rejectComment}`,
    });

    setIsProcessing(false);
    setSelectedLeave(null);
    setActionType(null);
    setRejectComment('');
    showToast(`Leave request rejected with comment recorded.`, 'info');
    loadData();
  };

  const handleSaveLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType.name || !editingType.code) {
      showToast('Please fill all required policy fields', 'error');
      return;
    }

    const typeObj: LeaveType = {
      id: editingType.id || `lt-${editingType.code?.toLowerCase()}`,
      name: editingType.name,
      code: editingType.code.toUpperCase(),
      defaultDays: Number(editingType.defaultDays) || 10,
      isPaid: editingType.isPaid ?? true,
      color: editingType.color || '#6366f1',
      description: editingType.description || '',
      carryForwardLimit: 5,
    };

    await dayflowDb.saveLeaveType(typeObj);
    showToast(`Policy for ${typeObj.name} saved successfully`, 'success');
    setIsPolicyModalOpen(false);
    setEditingType({
      name: '',
      code: '',
      defaultDays: 10,
      isPaid: true,
      color: '#6366f1',
      description: '',
    });
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Time Off & Leave Oversight
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>HR & Admin Portal</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve incoming employee time-off requests, check balances, and manage company PTO quotas.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all relative',
              activeTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <span>Pending Approvals</span>
            {pendingLeaves.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            All Leave History
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'policy'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Leave Types & Policy
          </button>
        </div>
      </div>

      {/* 1. PENDING APPROVALS TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Quick Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="Search pending requests..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <select
                value={pendingDept}
                onChange={(e) => setPendingDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-xl">
                {pendingLeaves.length} pending
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pending Applications ({pendingLeaves.length})
                </h2>
                <p className="text-xs text-slate-500">
                  HR Officers and Administrators are authorized to approve or reject employee leave
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>HR Approval Active</span>
              </span>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Pending Requests</p>
                <p className="text-xs text-slate-400 mt-0.5">All leave applications have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Employee</th>
                      <th className="py-3.5 px-6">Category & Balance</th>
                      <th className="py-3.5 px-6">Dates Requested</th>
                      <th className="py-3.5 px-6">Days</th>
                      <th className="py-3.5 px-6">Reason / Remarks</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingLeaves.map((req) => {
                      const empBals = employeeBalances[req.employeeId] || [];
                      const matchedBal = empBals.find((b) => b.leaveTypeId === req.leaveTypeId);
                      const remainingDays = matchedBal ? matchedBal.remaining : null;
                      const hasSufficient = remainingDays !== null ? remainingDays >= req.numberOfDays : true;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {req.employeeName?.[0] || 'E'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{req.employeeName}</p>
                                <p className="text-[10px] text-slate-400">{req.employeeDepartment}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-800">{req.leaveTypeName}</p>
                            {remainingDays !== null ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5 px-1.5 py-0.2 rounded',
                                  hasSufficient
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                )}
                              >
                                {remainingDays} days remaining
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Balance: Standard PTO</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-600">
                            {formatDate(req.startDate)} → {formatDate(req.endDate)}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 font-bold text-indigo-700">
                              {req.numberOfDays} {req.numberOfDays === 1 ? 'day' : 'days'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                            {req.remarks || '—'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeave(req);
                                  setActionType('VIEW');
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View Request Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeave(req);
                                  setActionType('REJECT');
                                }}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ALL LEAVE HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6">Leave Type</th>
                    <th className="py-3.5 px-6">Start Date</th>
                    <th className="py-3.5 px-6">End Date</th>
                    <th className="py-3.5 px-6">Days</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Reviewer / Decision Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{req.employeeName}</td>
                      <td className="py-3.5 px-6 text-slate-700">{req.leaveTypeName}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-600">{formatDate(req.startDate)}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-600">{formatDate(req.endDate)}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800">
                        {req.numberOfDays} d
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                        {req.reviewedByName && (
                          <span className="font-semibold text-slate-700 block">
                            Reviewed by: {req.reviewedByName}
                          </span>
                        )}
                        {req.reviewComment && <span className="italic">"{req.reviewComment}"</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAVE TYPES & POLICY TAB */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Leave Categories & Default Quotas</h2>
            <button
              type="button"
              onClick={() => {
                setEditingType({
                  name: '',
                  code: '',
                  defaultDays: 10,
                  isPaid: true,
                  color: '#6366f1',
                  description: '',
                });
                setIsPolicyModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white"
                      style={{ backgroundColor: type.color }}
                    >
                      {type.code}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        type.isPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {type.isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{type.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{type.description || 'Standard leave'}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">{type.defaultDays}</span>
                    <span className="text-[10px] text-slate-400 ml-1">days / yr</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(type);
                      setIsPolicyModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {actionType === 'VIEW' && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Leave Request Details</h3>
              <StatusBadge status={selectedLeave.status} size="sm" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {selectedLeave.employeeName?.[0] || 'E'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedLeave.employeeName}</p>
                  <p className="text-slate-500">{selectedLeave.employeeDepartment} • ID: {selectedLeave.employeeId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Leave Category</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedLeave.leaveTypeName}</p>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Duration Requested</span>
                  <p className="font-bold text-indigo-700 mt-0.5">{selectedLeave.numberOfDays} Business Day(s)</p>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Schedule Range</span>
                <p className="font-mono text-slate-800 font-semibold mt-0.5">
                  {formatDate(selectedLeave.startDate)} — {formatDate(selectedLeave.endDate)}
                </p>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Remarks / Reason</span>
                <p className="text-slate-700 mt-1 whitespace-pre-wrap">{selectedLeave.remarks || 'No remarks provided.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeave(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              {selectedLeave.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType('REJECT')}
                    className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedLeave)}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Request</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {actionType === 'REJECT' && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reject Leave Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide a required explanation comment for rejecting {selectedLeave.employeeName}'s {selectedLeave.leaveTypeName} request.
            </p>

            <div className="space-y-2 mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Quick Preset Reason:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Critical milestone / Sprint deadline',
                  'Team coverage constraints',
                  'Insufficient remaining PTO balance',
                  'Please reschedule to alternate dates',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectComment(reason)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. Critical deployment window occurring on those dates."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-hidden focus:border-rose-500"
              required
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeave(null);
                  setActionType(null);
                  setRejectComment('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingType.id ? 'Edit Leave Type' : 'Create Leave Type'}
            </h3>
            <form onSubmit={handleSaveLeaveType} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="e.g. Parental Leave"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Code</label>
                <input
                  type="text"
                  value={editingType.code}
                  onChange={(e) => setEditingType({ ...editingType, code: e.target.value })}
                  placeholder="e.g. PL"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Allocated Days / Year
                </label>
                <input
                  type="number"
                  value={editingType.defaultDays}
                  onChange={(e) =>
                    setEditingType({ ...editingType, defaultDays: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={editingType.isPaid}
                  onChange={(e) => setEditingType({ ...editingType, isPaid: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="paidCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Paid Time Off (Counts toward paid earnings)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
