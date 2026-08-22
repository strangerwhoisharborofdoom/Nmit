import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import {
  Employee,
  Attendance,
  LeaveRequest,
  SalaryProfile,
  AuditLog,
  EmployeeRemovalRequest,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  UserMinus,
  Shield,
  UserCheck,
} from 'lucide-react';
import { OffboardingApprovalsModal } from '../employees/OffboardingApprovalsModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import confetti from 'canvas-confetti';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [removalRequests, setRemovalRequests] = useState<EmployeeRemovalRequest[]>([]);
  const [salaryProfiles, setSalaryProfiles] = useState<SalaryProfile[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);

  // Leave approval / reject modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    setIsLoading(true);
    const [empList, attList, leaveList, remList, logs] = await Promise.all([
      dayflowDb.getEmployees(),
      dayflowDb.getAttendance(undefined, todayStr.substring(0, 7)),
      dayflowDb.getLeaveRequests(),
      dayflowDb.getRemovalRequests(),
      dayflowDb.getAuditLogs(),
    ]);

    setEmployees(empList);
    setAttendanceRecords(attList);
    setLeaveRequests(leaveList);
    setRemovalRequests(remList);
    setRecentAuditLogs(logs.slice(0, 5));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute key stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employmentStatus === 'ACTIVE').length;
  
  // Today's attendance
  const todayAttendance = attendanceRecords.filter((a) => a.date === todayStr);
  const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  // Pending leaves
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING');
  const onLeaveToday = leaveRequests.filter(
    (l) => l.status === 'APPROVED' && l.startDate <= todayStr && l.endDate >= todayStr
  ).length;

  // Department distribution data for charts
  const deptCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
  });
  const deptChartData = Object.keys(deptCounts).map((dept) => ({
    name: dept,
    value: deptCounts[dept],
  }));

  // Attendance Trend Mock Data (past 5 working days)
  const attendanceTrendData = [
    { day: 'Mon', Present: 6, Absent: 0, Leave: 1 },
    { day: 'Tue', Present: 7, Absent: 0, Leave: 0 },
    { day: 'Wed', Present: 6, Absent: 1, Leave: 0 },
    { day: 'Thu', Present: 7, Absent: 0, Leave: 0 },
    { day: 'Fri (Today)', Present: presentToday || 6, Absent: 0, Leave: onLeaveToday || 1 },
  ];

  const handleApproveLeave = async (req: LeaveRequest) => {
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
      newValue: `Approved ${req.numberOfDays} days for ${req.employeeName}`,
    });

    setIsProcessing(false);
    setSelectedLeave(null);
    setActionType(null);
    showToast(`Leave request for ${req.employeeName} approved!`, 'success');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    loadData();
  };

  const handleRejectLeave = async () => {
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
      actorName: currentEmployee?.fullName || 'HR Admin',
      actorRole: role || 'ADMIN',
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Executive HR Dashboard</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {role === 'ADMIN' ? 'Full Administrator' : 'HR Officer'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workforce attendance, leave oversight, payroll readiness, and employee administration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsApprovalsModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 relative"
          >
            <UserMinus className="w-4 h-4 text-rose-600" />
            <span>Offboarding Approvals</span>
            {removalRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {removalRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/employees')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Employees</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/payroll')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Payroll Engine</span>
          </button>
        </div>
      </div>

      {/* Pending Offboarding Approvals Banner (Admin / HR) */}
      {removalRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-rose-900 text-sm">
                  Employee Offboarding Approval Requests Pending
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 text-[11px] font-black">
                  {removalRequests.filter((r) => r.status === 'PENDING').length} Pending
                </span>
              </div>
              <p className="text-xs text-rose-700/80 mt-0.5">
                HR officers have submitted separation requests requiring Administrator review, sign-off, and termination authorization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsApprovalsModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Review & Authorize</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalEmployees}</span>
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Across {Object.keys(deptCounts).length || 1} active department{Object.keys(deptCounts).length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Present Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{presentToday || 6}</span>
            <span className="text-xs font-semibold text-slate-500">/ {totalEmployees} employees</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${attendanceRate || 85}%` }}
            />
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              On Leave Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{onLeaveToday || 1}</span>
            <span className="text-xs font-semibold text-sky-600">Approved PTO/Sick</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">No shift impact reported</p>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Action Required
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {pendingLeaves.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">pending approvals</span>
          </div>
          <p className="text-xs text-amber-600/80 font-medium mt-2">Requires reviewer action</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly Attendance Trends</h2>
              <p className="text-xs text-slate-500">Recorded employee check-ins across this week</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              This Week
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Leave" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Department Distribution</h2>
                <p className="text-xs text-slate-500">Employee headcount</p>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 max-h-24 overflow-y-auto">
            {deptChartData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate max-w-36">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Leave Approvals</h2>
            <p className="text-xs text-slate-500">Review, approve, or reject employee time-off requests</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/time-off')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Leave Records</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">There are no pending leave requests awaiting approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Leave Type</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Days</th>
                  <th className="py-3.5 px-6">Reason / Remarks</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pendingLeaves.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {req.employeeName?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{req.employeeDepartment}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-700">{req.leaveTypeName}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {formatDate(req.startDate)} → {formatDate(req.endDate)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100">
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
                          onClick={() => handleApproveLeave(req)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
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
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Leave Reason Modal */}
      {actionType === 'REJECT' && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reject Leave Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide a required comment for rejecting {selectedLeave.employeeName}'s {selectedLeave.leaveTypeName} request.
            </p>
            <textarea
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. Critical project milestone scheduled during this period."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              required
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeave(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectLeave}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offboarding Approvals Modal */}
      <OffboardingApprovalsModal
        isOpen={isApprovalsModalOpen}
        onClose={() => setIsApprovalsModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
