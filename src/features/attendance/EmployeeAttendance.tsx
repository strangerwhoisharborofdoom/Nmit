import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dayflowDb } from '../../services/db';
import { Attendance } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  LogIn,
  LogOut,
  TrendingUp,
  Download,
  CheckCircle2,
} from 'lucide-react';

export const EmployeeAttendance: React.FC = () => {
  const { currentEmployee } = useAuth();
  const { showToast } = useToast();

  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [isLoading, setIsLoading] = useState(true);

  const monthYearStr = `${currentMonthDate.getFullYear()}-${String(
    currentMonthDate.getMonth() + 1
  ).padStart(2, '0')}`;

  const fetchAttendance = async () => {
    if (!currentEmployee) return;
    setIsLoading(true);
    const data = await dayflowDb.getAttendance(currentEmployee.employeeId, monthYearStr);
    setAttendanceList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentEmployee, monthYearStr]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentMonthDate(new Date());
  };

  // Summary Metrics
  const presentDays = attendanceList.filter((a) => a.status === 'PRESENT').length;
  const halfDays = attendanceList.filter((a) => a.status === 'HALF_DAY').length;
  const leaveDays = attendanceList.filter((a) => a.status === 'LEAVE').length;
  const totalWorkHours = attendanceList.reduce((sum, a) => sum + (a.workHours || 0), 0);
  const totalExtraHours = attendanceList.reduce((sum, a) => sum + (a.extraHours || 0), 0);

  const handleExportCSV = () => {
    const headers = 'Date,Check In,Check Out,Work Hours,Extra Hours,Status,Source\n';
    const rows = attendanceList
      .map(
        (a) =>
          `"${a.date}","${formatTime(a.checkIn)}","${formatTime(a.checkOut)}","${a.workHours}","${a.extraHours}","${a.status}","${a.attendanceSource}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_${currentEmployee?.employeeId}_${monthYearStr}.csv`;
    link.click();
    showToast('Attendance report exported to CSV', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Attendance Timesheet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review daily work hours, break durations, and overtime records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-32 text-center">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Days Present
          </p>
          <p className="text-2xl font-black text-emerald-600">{presentDays}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Half Days
          </p>
          <p className="text-2xl font-black text-amber-600">{halfDays}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Leave Days
          </p>
          <p className="text-2xl font-black text-sky-600">{leaveDays}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Hours
          </p>
          <p className="text-2xl font-black text-indigo-600">{totalWorkHours.toFixed(1)} hrs</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Extra Overtime
          </p>
          <p className="text-2xl font-black text-emerald-600">+{totalExtraHours.toFixed(1)} hrs</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Timesheet Log</h2>
          <span className="text-xs text-slate-400">Shift Rule: 8.0 hrs standard / day</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading attendance records...</div>
        ) : attendanceList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attendance entries for this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Check In</th>
                  <th className="py-3.5 px-6">Check Out</th>
                  <th className="py-3.5 px-6">Work Duration</th>
                  <th className="py-3.5 px-6">Extra Hours</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceList.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {formatDate(rec.date)}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">
                      {formatTime(rec.checkIn)}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">
                      {formatTime(rec.checkOut)}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-indigo-600">
                      {rec.workHours ? `${rec.workHours} hrs` : '—'}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">
                      {rec.extraHours ? `+${rec.extraHours} hrs` : '0.00'}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                      {rec.attendanceSource.replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
