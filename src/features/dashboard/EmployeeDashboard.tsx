import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dayflowDb } from '../../services/db';
import { Attendance, LeaveBalance, LeaveRequest, Notification } from '../../types';
import { calculateAttendanceHours } from '../../services/attendanceEngine';
import { formatDate, formatTime, formatCurrency } from '../../lib/utils';
import { ApplyLeaveModal } from '../timeoff/ApplyLeaveModal';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EmployeeDashboard: React.FC = () => {
  const { currentEmployee, currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunching, setIsPunching] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    if (!currentEmployee) return;
    
    // Load attendance
    const attList = await dayflowDb.getAttendance(currentEmployee.employeeId);
    const todayRec = attList.find((a) => a.date === todayDateStr) || null;
    setTodayAttendance(todayRec);

    // Load leave balances
    const balances = await dayflowDb.getLeaveBalances(currentEmployee.employeeId, 2026);
    setLeaveBalances(balances);

    // Load recent leave requests
    const leaves = await dayflowDb.getLeaveRequests(currentEmployee.employeeId);
    setRecentLeaves(leaves.slice(0, 3));

    // Load notifications
    const notifs = await dayflowDb.getNotifications(currentUser?.uid);
    setRecentNotifications(notifs.slice(0, 3));
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentEmployee]);

  const handleCheckIn = async () => {
    if (!currentEmployee) return;
    setIsPunching(true);
    const nowIso = new Date().toISOString();

    const newRecord: Attendance = {
      id: `att-${currentEmployee.employeeId}-${todayDateStr}`,
      employeeId: currentEmployee.employeeId,
      date: todayDateStr,
      checkIn: nowIso,
      checkOut: null,
      totalBreakMinutes: 0,
      workHours: 0,
      extraHours: 0,
      status: 'PRESENT',
      attendanceSource: 'WEB_CHECK_IN',
      remarks: 'Checked in via Web Dashboard',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await dayflowDb.saveAttendance(newRecord);
    setTodayAttendance(newRecord);
    setIsPunching(false);
    showToast('Checked in successfully! Have a productive day.', 'success', 'Checked In');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
  };

  const handleCheckOut = async () => {
    if (!currentEmployee || !todayAttendance) return;
    setIsPunching(true);
    const nowIso = new Date().toISOString();

    const calc = calculateAttendanceHours(
      todayAttendance.checkIn,
      nowIso,
      todayAttendance.totalBreakMinutes || 0,
      8.0
    );

    const updatedRecord: Attendance = {
      ...todayAttendance,
      checkOut: nowIso,
      workHours: calc.workHours,
      extraHours: calc.extraHours,
      status: calc.status,
      updatedAt: nowIso,
    };

    await dayflowDb.saveAttendance(updatedRecord);
    setTodayAttendance(updatedRecord);
    setIsPunching(false);
    showToast(
      `Checked out. Logged ${calc.workHours} hrs (${calc.extraHours} extra hrs).`,
      'info',
      'Checked Out'
    );
  };

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{formatDate(todayDateStr)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting()}, {currentEmployee?.firstName || 'Colleague'}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Welcome to your Dayflow workspace. Manage your daily attendance, leave balances, and view your monthly compensation summary.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-4 rounded-2xl">
            <Clock className="w-8 h-8 text-indigo-400 animate-pulse" />
            <div>
              <p className="text-2xl font-black font-mono tracking-tight">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Attendance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Today's Attendance</h2>
                  <p className="text-xs text-slate-500">{formatDate(todayDateStr)}</p>
                </div>
              </div>

              <div>
                {todayAttendance ? (
                  <StatusBadge status={todayAttendance.status} />
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Not Checked In
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Punch Timings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Check In
                </p>
                <p className="text-base font-bold text-slate-900">
                  {formatTime(todayAttendance?.checkIn)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Check Out
                </p>
                <p className="text-base font-bold text-slate-900">
                  {formatTime(todayAttendance?.checkOut)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Work Hours
                </p>
                <p className="text-base font-bold text-indigo-600">
                  {todayAttendance?.workHours ? `${todayAttendance.workHours} hrs` : '—'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Extra Hours
                </p>
                <p className="text-base font-bold text-emerald-600">
                  {todayAttendance?.extraHours ? `+${todayAttendance.extraHours} hrs` : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Punch Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Shift Standard: 8.0 Hours / Day</span>
            </div>

            <div className="flex items-center gap-3">
              {!isCheckedIn ? (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={isPunching}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Check In Now</span>
                </button>
              ) : !isCheckedOut ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={isPunching}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check Out Now</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed Today's Shift</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Card (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Direct access to core self-service tools</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/employee/profile')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">My Profile</p>
                <p className="text-[10px] text-slate-400">Personal & job details</p>
              </button>

              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">Apply Leave</p>
                <p className="text-[10px] text-slate-400">Request PTO or Sick</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/employee/attendance')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">Attendance</p>
                <p className="text-[10px] text-slate-400">Monthly timesheets</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/employee/salary')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">My Salary</p>
                <p className="text-[10px] text-slate-400">Wage & deductions</p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/employee/documents')}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>My Documents & Contracts</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Leave Balances Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Leave Balances (2026)</h2>
          <button
            type="button"
            onClick={() => navigate('/employee/time-off')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All & Apply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaveBalances.map((bal) => (
            <div
              key={bal.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600">{bal.leaveTypeName}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {bal.allocated} Allocated
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-extrabold text-slate-900">{bal.remaining}</span>
                <span className="text-xs font-semibold text-slate-400">days left</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (bal.remaining / (bal.allocated || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{bal.used} Days Used</span>
                {bal.pending > 0 && <span className="text-amber-600 font-semibold">{bal.pending} Pending</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity: Leaves & Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Recent Leave Requests</h3>
            <button
              onClick={() => navigate('/employee/time-off')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          {recentLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent leave requests</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((lr) => (
                <div
                  key={lr.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{lr.leaveTypeName}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(lr.startDate)} to {formatDate(lr.endDate)} • {lr.numberOfDays} days
                    </p>
                  </div>
                  <StatusBadge status={lr.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Updates */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Recent Notifications</h3>
            <span className="text-xs text-slate-400">Activity stream</span>
          </div>

          {recentNotifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent notifications</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{notif.message}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(notif.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          showToast('Leave request submitted and updated in dashboard', 'success');
        }}
      />
    </div>
  );
};
