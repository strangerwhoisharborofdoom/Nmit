import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CreateEmployeeModal } from './CreateEmployeeModal';
import { dayflowDb } from '../../services/db';
import { Employee } from '../../types';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

export const EmployeeList: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const data = await dayflowDb.getEmployees();
    setEmployees(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || emp.employmentStatus === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Workforce Directory</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {employees.length} Members
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, manage, and inspect complete personnel records and salary configurations.
          </p>
        </div>

        {(role === 'ADMIN' || role === 'HR') && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, designation, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns & View Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="PROBATION">Probation</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg text-slate-600 transition-colors',
                viewMode === 'grid' && 'bg-white shadow-2xs text-indigo-600 font-bold'
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg text-slate-600 transition-colors',
                viewMode === 'table' && 'bg-white shadow-2xs text-indigo-600 font-bold'
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee List Presentation */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No employees found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new team member to the workspace.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/admin/employees/${emp.employeeId}`)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <img
                    src={
                      emp.profilePictureUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt={emp.fullName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:scale-105 transition-transform"
                  />
                  <StatusBadge status={emp.employmentStatus} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  {emp.fullName}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 mb-1">{emp.designation}</p>
                <p className="text-[11px] font-mono text-slate-400 mb-3">{emp.employeeId}</p>

                <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Joined {formatDate(emp.dateOfJoining)}</span>
                <span className="text-indigo-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Overview <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Employee ID</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Designation</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/admin/employees/${emp.employeeId}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            emp.profilePictureUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                          }
                          alt={emp.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{emp.fullName}</p>
                          <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 font-medium">
                      {emp.employeeId}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">{emp.department}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">{emp.designation}</td>
                    <td className="py-3.5 px-6 text-slate-500">{emp.location}</td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={emp.employmentStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                        View Profile →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
        }}
      />
    </div>
  );
};
