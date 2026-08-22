import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Department, Employee } from '../../types';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Briefcase,
  Layers,
  Sparkles,
  UserCheck,
  X,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

export const DepartmentManager: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDept, setHeadOfDept] = useState('');
  const [location, setLocation] = useState('San Francisco HQ');
  const [budget, setBudget] = useState<number>(150000);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal state
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [reassignDept, setReassignDept] = useState('General');
  const [isDeleting, setIsDeleting] = useState(false);

  // View Employees Modal state
  const [viewingDeptEmployees, setViewingDeptEmployees] = useState<Department | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [deptList, empList] = await Promise.all([
      dayflowDb.getDepartments(),
      dayflowDb.getEmployees(),
    ]);
    setDepartments(deptList);
    setEmployees(empList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setHeadOfDept(employees[0]?.fullName || '');
    setLocation('San Francisco HQ');
    setBudget(200000);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setHeadOfDept(dept.headOfDepartment || '');
    setLocation(dept.location || 'San Francisco HQ');
    setBudget(dept.budget || 150000);
    setIsAddModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingDept && !code) {
      // Auto-suggest code from name
      const suggested = val
        .trim()
        .split(/[\s&_-]+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();
      setCode(suggested);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a department name', 'error');
      return;
    }

    setIsSaving(true);
    const actorInfo = {
      actorUserId: currentUser?.uid || 'admin',
      actorName: currentEmployee?.fullName || 'Admin Officer',
      actorRole: role || 'ADMIN',
    };

    if (editingDept) {
      const res = await dayflowDb.updateDepartment(
        editingDept.id,
        {
          name: name.trim(),
          code: code.trim().toUpperCase() || 'DEPT',
          description: description.trim(),
          headOfDepartment: headOfDept.trim(),
          location: location.trim(),
          budget: Number(budget) || 0,
        },
        actorInfo
      );
      setIsSaving(false);
      if (res.success) {
        showToast(res.message || 'Department updated successfully', 'success');
        setIsAddModalOpen(false);
        await loadData();
      } else {
        showToast(res.message || 'Failed to update department', 'error');
      }
    } else {
      const res = await dayflowDb.addDepartment(
        {
          name: name.trim(),
          code: code.trim().toUpperCase() || 'DEPT',
          description: description.trim(),
          headOfDepartment: headOfDept.trim(),
          location: location.trim(),
          budget: Number(budget) || 0,
        },
        actorInfo
      );
      setIsSaving(false);
      if (res.success) {
        showToast(res.message || 'Department added successfully', 'success');
        setIsAddModalOpen(false);
        await loadData();
      } else {
        showToast(res.message || 'Failed to add department', 'error');
      }
    }
  };

  const handleOpenDelete = (dept: Department) => {
    setDeptToDelete(dept);
    // Find default reassignment department other than the one being deleted
    const otherDepts = departments.filter((d) => d.id !== dept.id);
    setReassignDept(otherDepts[0]?.name || 'General');
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    const actorInfo = {
      actorUserId: currentUser?.uid || 'admin',
      actorName: currentEmployee?.fullName || 'Admin Officer',
      actorRole: role || 'ADMIN',
    };

    const res = await dayflowDb.deleteDepartment(
      deptToDelete.id,
      reassignDept,
      actorInfo
    );
    setIsDeleting(false);
    setDeptToDelete(null);

    if (res.success) {
      showToast(res.message || 'Department deleted successfully', 'success');
      await loadData();
    } else {
      showToast(res.message || 'Failed to delete department', 'error');
    }
  };

  // Filtered departments based on search query
  const filteredDepartments = departments.filter((dept) => {
    const q = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      (dept.description && dept.description.toLowerCase().includes(q)) ||
      (dept.headOfDepartment && dept.headOfDepartment.toLowerCase().includes(q)) ||
      (dept.location && dept.location.toLowerCase().includes(q))
    );
  });

  // Calculate stats
  const totalDepts = departments.length;
  const totalAssignedStaff = employees.filter((e) =>
    departments.some((d) => d.name.toLowerCase() === e.department.toLowerCase())
  ).length;

  const getDeptEmployees = (deptName: string) => {
    return employees.filter(
      (e) => e.department.toLowerCase() === deptName.toLowerCase()
    );
  };

  return (
    <div id="department_management_container" className="space-y-6">
      {/* Top Header with Stats and Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Department Directory & Organization Units</h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Create, configure, and delete organizational departments. Changes instantly synchronize across employee onboarding, role assignments, time off approvals, and analytics.
            </p>
          </div>

          <button
            id="open_add_department_modal_btn"
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {/* Stats Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Departments
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalDepts}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Assigned Employees
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalAssignedStaff}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Locations
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {Array.from(new Set(departments.map((d) => d.location || 'San Francisco HQ'))).length}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="search_departments_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name, code, lead, or location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredDepartments.length}</span> of{' '}
          <span className="font-bold text-slate-900">{departments.length}</span> departments
        </div>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading department structures...</span>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Departments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No departments matched "${searchQuery}". Try a different keyword.`
              : 'There are currently no departments configured. Add your first organization unit to get started.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Clear Search Query
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Create First Department
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const deptEmps = getDeptEmployees(dept.name);
            const isProtectedHR = dept.name.toLowerCase() === 'human resources';

            return (
              <div
                key={dept.id}
                id={`department_card_${dept.id}`}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Card Header: Code Badge & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs tracking-wider uppercase font-mono">
                        {dept.code}
                      </span>
                      {isProtectedHR && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold">
                          Core HR
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit_dept_btn_${dept.id}`}
                        type="button"
                        onClick={() => handleOpenEdit(dept)}
                        title="Edit Department"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete_dept_btn_${dept.id}`}
                        type="button"
                        onClick={() => handleOpenDelete(dept)}
                        title="Delete Department"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-base mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {dept.description || 'No specific description provided for this department unit.'}
                  </p>

                  {/* Meta Items */}
                  <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Head / Lead</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                        {dept.headOfDepartment || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Location</span>
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                        {dept.location || 'San Francisco HQ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Assigned Staff & View List */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewingDeptEmployees(dept)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {deptEmps.slice(0, 3).map((emp) => (
                        <img
                          key={emp.id}
                          src={emp.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775?w=150'}
                          alt={emp.fullName}
                          referrerPolicy="no-referrer"
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {deptEmps.length} {deptEmps.length === 1 ? 'member' : 'members'}
                    </span>
                  </button>

                  <button
                    id={`view_members_btn_${dept.id}`}
                    type="button"
                    onClick={() => setViewingDeptEmployees(dept)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View Members</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. ADD / EDIT DEPARTMENT MODAL */}
      {isAddModalOpen && (
        <div id="add_edit_department_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {editingDept ? 'Edit Department Unit' : 'Add New Department'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingDept
                    ? `Update properties for ${editingDept.name}`
                    : 'Establish a new organizational division for team allocation and workflows.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="dept_input_name"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Marketing"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Code / Acronym <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="dept_input_code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AI, MKT"
                    maxLength={6}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono font-bold uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Responsibilities</label>
                <textarea
                  id="dept_input_description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Outline the mission, primary objectives, and scope of this department..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head of Department / Lead</label>
                  <select
                    id="dept_input_head"
                    value={headOfDept}
                    onChange={(e) => setHeadOfDept(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Select Department Lead --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.fullName}>
                        {emp.fullName} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Office Location</label>
                  <select
                    id="dept_input_location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="San Francisco HQ">San Francisco HQ</option>
                    <option value="New York Office">New York Office</option>
                    <option value="Austin Hub">Austin Hub</option>
                    <option value="London Office">London Office</option>
                    <option value="Remote / Distributed">Remote / Distributed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Annual Budget Allocation (₹)
                </label>
                <div className="relative">
                  <span className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 font-bold text-xs">₹</span>
                  <input
                    id="dept_input_budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min={0}
                    step={50000}
                    className="w-full border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  id="submit_department_form_btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editingDept ? 'Save Changes' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SMART DELETE DEPARTMENT MODAL */}
      {deptToDelete && (
        <div id="delete_department_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 sm:p-7 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg mb-1">
              Delete Department: {deptToDelete.name}?
            </h3>

            {/* Check affected employees */}
            {(() => {
              const affected = getDeptEmployees(deptToDelete.name);
              const remainingDepts = departments.filter((d) => d.id !== deptToDelete.id);

              return (
                <div className="space-y-4 text-xs mt-3">
                  {affected.length > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{affected.length} Active Employee(s) Assigned</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-700">
                        The following employees belong to this department:{' '}
                        <strong>{affected.map((e) => e.fullName).join(', ')}</strong>.
                      </p>
                      <div>
                        <label className="block font-bold text-amber-900 mb-1">
                          Reassign these employees to:
                        </label>
                        <select
                          id="reassign_dept_select"
                          value={reassignDept}
                          onChange={(e) => setReassignDept(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                        >
                          <option value="General">General / Unassigned</option>
                          {remainingDepts.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 leading-relaxed">
                      This department currently has no assigned staff. It will be permanently removed from the system and recorded in the audit trail.
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeptToDelete(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm_delete_dept_btn"
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm Delete</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. VIEW DEPARTMENT EMPLOYEES MODAL */}
      {viewingDeptEmployees && (
        <div id="view_dept_members_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setViewingDeptEmployees(null)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {viewingDeptEmployees.name} Team Members
                </h3>
                <p className="text-xs text-slate-500">
                  {getDeptEmployees(viewingDeptEmployees.name).length} employees currently assigned
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-1">
              {getDeptEmployees(viewingDeptEmployees.name).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No employees are currently assigned to this department.
                </div>
              ) : (
                getDeptEmployees(viewingDeptEmployees.name).map((emp) => (
                  <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775?w=150'}
                        alt={emp.fullName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{emp.fullName}</span>
                        <span className="text-[11px] text-slate-500">{emp.designation}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {emp.employeeId}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDeptEmployees(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
