import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dayflowDb } from '../../services/db';
import { Attendance, Employee, AttendanceStatus } from '../../types';
import { calculateAttendanceHours } from '../../services/attendanceEngine';
import { formatDate, formatTime } from '../../lib/utils';
import {
  Clock,
  Search,
  Filter,
  Download,
  Calendar,
  UserCheck,
  Edit2,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Punch/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmpId, setModalEmpId] = useState('');
  const [modalDate, setModalDate] = useState(selectedDate);
  const [modalCheckIn, setModalCheckIn] = useState('09:00');
  const [modalCheckOut, setModalCheckOut] = useState('17:30');
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('PRESENT');
  const [modalRemarks, setModalRemarks] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [attList, empList] = await Promise.all([
      dayflowDb.getAttendance(undefined, selectedDate.substring(0, 7)),
      dayflowDb.getEmployees(),
    ]);
    setAttendanceRecords(attList);
    setEmployees(empList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Map employee list to attendance for selectedDate
  const mergedList = employees.map((emp) => {
    const matched = attendanceRecords.find(
      (a) => a.employeeId === emp.employeeId && a.date === selectedDate
    );
    return {
      employee: emp,
      attendance: matched || null,
    };
  });

  const filtered = mergedList.filter(({ employee, attendance }) => {
    const matchesSearch =
      employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || employee.department === deptFilter;
    const currentStatus = attendance?.status || 'ABSENT';
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmpId) {
      showToast('Please select an employee', 'error');
      return;
    }

    const calc = calculateAttendanceHours(
      modalCheckIn ? `${modalDate}T${modalCheckIn}:00Z` : null,
      modalCheckOut ? `${modalDate}T${modalCheckOut}:00Z` : null,
      0,
      8.0
    );

    const record: Attendance = {
      id: `att-${modalEmpId}-${modalDate}`,
      employeeId: modalEmpId,
      date: modalDate,
      checkIn: modalCheckIn ? `${modalDate}T${modalCheckIn}:00Z` : null,
      checkOut: modalCheckOut ? `${modalDate}T${modalCheckOut}:00Z` : null,
      workHours: calc.workHours,
      extraHours: calc.extraHours,
      status: modalStatus || calc.status,
      attendanceSource: 'MANUAL',
      remarks: modalRemarks || 'Adjusted by HR Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dayflowDb.saveAttendance(record);
    await dayflowDb.logAudit({
      actorUserId: currentUser?.uid || 'admin',
      actorName: currentEmployee?.fullName || 'HR Admin',
      actorRole: role || 'ADMIN',
      action: 'ATTENDANCE_OVERRIDDEN',
      entityType: 'Attendance',
      entityId: record.id,
      newValue: `Adjusted attendance for ${modalEmpId} on ${modalDate} (${record.status})`,
    });

    showToast('Attendance record saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const handleExportCSV = () => {
    const headers = 'Employee ID,Employee Name,Department,Date,Check In,Check Out,Work Hours,Extra Hours,Status\n';
    const rows = filtered
      .map(({ employee, attendance }) => {
        return `"${employee.employeeId}","${employee.fullName}","${employee.department}","${selectedDate}","${formatTime(
          attendance?.checkIn
        )}","${formatTime(attendance?.checkOut)}","${attendance?.workHours || 0}","${
          attendance?.extraHours || 0
        }","${attendance?.status || 'ABSENT'}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Workforce_Attendance_${selectedDate}.csv`;
    link.click();
    showToast('Exported attendance list to CSV', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Workforce Attendance Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor daily employee check-ins, resolve missing checkouts, and maintain records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setModalDate(selectedDate);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry / Adjustment</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden"
            />
          </div>

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
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Check In</th>
                <th className="py-3.5 px-6">Check Out</th>
                <th className="py-3.5 px-6">Work Hours</th>
                <th className="py-3.5 px-6">Extra Hours</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ employee, attendance }) => (
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
                  <td className="py-3.5 px-6 font-mono text-slate-800">
                    {formatTime(attendance?.checkIn)}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-800">
                    {formatTime(attendance?.checkOut)}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-indigo-600">
                    {attendance?.workHours ? `${attendance.workHours} hrs` : '—'}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600">
                    {attendance?.extraHours ? `+${attendance.extraHours} hrs` : '0.00'}
                  </td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={attendance?.status || 'ABSENT'} size="sm" />
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setModalEmpId(employee.employeeId);
                        setModalDate(selectedDate);
                        setModalStatus(attendance?.status || 'PRESENT');
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100"
                      title="Adjust Record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Attendance Adjustment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Manually modify or record attendance punches for this employee.
            </p>

            <form onSubmit={handleSaveManualAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee</label>
                <select
                  value={modalEmpId}
                  onChange={(e) => setModalEmpId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={modalCheckIn}
                    onChange={(e) => setModalCheckIn(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={modalCheckOut}
                    onChange={(e) => setModalCheckOut(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Override</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Remarks</label>
                <input
                  type="text"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="e.g. Approved manager shift override"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
