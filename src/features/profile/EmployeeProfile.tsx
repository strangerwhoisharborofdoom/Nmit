import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import {
  Employee,
  SalaryProfile,
  SalaryComponent,
  EmployeeDocument,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  DollarSign,
  Shield,
  FileText,
  Edit3,
  Save,
  X,
  Upload,
  Trash2,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Key,
  UserMinus,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RequestRemovalModal } from '../employees/RequestRemovalModal';
import { AdminUserCredentialModal } from '../employees/AdminUserCredentialModal';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { currentUser, currentEmployee, role, resetPassword, updateCurrentEmployeeProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const isAdmin = role === 'ADMIN';
  const isAdminOrHR = role === 'ADMIN' || role === 'HR';
  const targetEmployeeId = id || currentEmployee?.employeeId || 'DAYFLOW-DC2024-003';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaryProfile, setSalaryProfile] = useState<SalaryProfile | null>(null);
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'security'>('resume');

  // Offboarding & Role modals
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [showPasswordAdmin, setShowPasswordAdmin] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'salary' || tabParam === 'private' || tabParam === 'resume' || tabParam === 'security') {
      setActiveTab(tabParam);
    } else if (tabParam === 'documents' || location.pathname.includes('documents')) {
      setActiveTab('resume');
    }
  }, [searchParams, location.pathname]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [editWage, setEditWage] = useState<number>(0);

  // Document upload modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<any>('RESUME');

  const fetchProfileData = async () => {
    setIsLoading(true);
    const emp = await dayflowDb.getEmployeeById(targetEmployeeId);
    if (emp) {
      setEmployee(emp);
      setEditFormData(emp);

      const [sp, sc, docs] = await Promise.all([
        dayflowDb.getSalaryProfile(emp.employeeId),
        dayflowDb.getSalaryComponents(),
        dayflowDb.getDocuments(emp.employeeId),
      ]);

      setSalaryProfile(sp);
      if (sp) setEditWage(sp.monthlyWage);
      setSalaryComponents(sc);
      setDocuments(docs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [targetEmployeeId]);

  const handleSaveProfile = async () => {
    if (!employee) return;
    setIsSaving(true);
    try {
      const updated: Employee = {
        ...employee,
        ...editFormData,
        updatedAt: new Date().toISOString(),
      };

      await dayflowDb.saveEmployee(updated, {
        id: currentUser?.uid || 'user',
        name: currentEmployee?.fullName || 'User',
        role: role || 'EMPLOYEE',
      });

      // If Admin and wage edited
      if (isAdminOrHR && salaryProfile && editWage !== salaryProfile.monthlyWage) {
        const updatedSp: SalaryProfile = {
          ...salaryProfile,
          monthlyWage: Number(editWage),
          yearlyWage: Number(editWage) * 12,
          updatedAt: new Date().toISOString(),
        };
        await dayflowDb.saveSalaryProfile(updatedSp, {
          id: currentUser?.uid || 'admin',
          name: currentEmployee?.fullName || 'HR Admin',
          role: role || 'ADMIN',
        });
        setSalaryProfile(updatedSp);
      }

      setEmployee(updated);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !docName) return;

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      employeeId: employee.employeeId,
      name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
      documentType: docType,
      storageUrl: 'https://example.com/docs/' + encodeURIComponent(docName),
      fileSize: '450 KB',
      uploadedBy: currentUser?.uid || 'user',
      uploadedByName: currentEmployee?.fullName || 'User',
      uploadedAt: new Date().toISOString(),
      visibility: 'EMPLOYEE_VISIBLE',
    };

    await dayflowDb.saveDocument(newDoc);
    setDocuments((prev) => [...prev, newDoc]);
    setIsDocModalOpen(false);
    setDocName('');
    showToast('Document uploaded successfully!', 'success');
  };

  const handleDeleteDocument = async (docId: string) => {
    await dayflowDb.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    showToast('Document removed', 'info');
  };

  const handleSendPasswordReset = async () => {
    if (!employee) return;
    const res = await resetPassword(employee.email);
    showToast(res.message || 'Password reset email sent.', 'info');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">
        Loading employee profile...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Employee not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const monthlyWage = salaryProfile?.monthlyWage || 9000;
  const basicSalary = (monthlyWage * 0.5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button if navigated from admin employee list */}
      {id && (
        <button
          type="button"
          onClick={() => navigate('/admin/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workforce Directory</span>
        </button>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group">
              <img
                src={
                  employee.profilePictureUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                }
                alt={employee.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-slate-100 shadow-md"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                  Change
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{employee.fullName}</h1>
                <StatusBadge status={employee.employmentStatus} size="sm" />
              </div>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{employee.designation}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                  {employee.employeeId}
                </span>
                <span>•</span>
                <span>{employee.department}</span>
                <span>•</span>
                <span>{employee.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdminOrHR && employee.employmentStatus !== 'TERMINATED' && (
              <>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Assign Role & Dept</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsRemovalModalOpen(true)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserMinus className="w-4 h-4 text-rose-600" />
                  <span>{isAdmin ? 'Offboard / Terminate' : 'Request Offboarding'}</span>
                </button>
              </>
            )}

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Information</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditFormData(employee);
                  }}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
              activeTab === 'resume'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Overview & Documents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('private')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
              activeTab === 'private'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Private & Contact Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
              activeTab === 'salary'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Salary & Compensation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
              activeTab === 'security'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Account & Security
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {/* 1. OVERVIEW & RESUME TAB */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Professional Details (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Company</label>
                <p className="font-bold text-slate-900">{employee.company}</p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Department</label>
                <p className="font-bold text-slate-900">{employee.department}</p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Designation</label>
                <p className="font-bold text-indigo-600">{employee.designation}</p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Reports To (Manager)</label>
                <p className="font-bold text-slate-900">{employee.manager || 'Alex Morgan'}</p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Date of Joining</label>
                <p className="font-bold text-slate-900">{formatDate(employee.dateOfJoining)}</p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Work Location</label>
                <p className="font-bold text-slate-900">{employee.location}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-2">Professional Summary & Bio</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {employee.fullName} is an active member of the {employee.department} department at{' '}
                {employee.company}. Dedicated to engineering excellence and cross-functional leadership.
              </p>
            </div>
          </div>

          {/* Documents Section (1 Col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">Documents</h3>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {doc.documentType} • {doc.fileSize || '300 KB'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => showToast(`Downloading ${doc.name}`, 'info')}
                          className="p-1 text-slate-500 hover:text-indigo-600 transition-colors text-xs"
                          title="Download"
                        >
                          ↓
                        </button>
                        {isAdminOrHR && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVATE INFO TAB */}
      {activeTab === 'private' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-6">
            Private & Personal Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Email Address</label>
              {isEditing && isAdminOrHR ? (
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900">{employee.email}</p>
              )}
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">
                Phone Number {isEditing && <span className="text-indigo-600">(Editable)</span>}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900">{employee.phone || '—'}</p>
              )}
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">Date of Birth</label>
              {isEditing && isAdminOrHR ? (
                <input
                  type="date"
                  value={editFormData.dateOfBirth || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900">{formatDate(employee.dateOfBirth)}</p>
              )}
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">Gender</label>
              {isEditing && isAdminOrHR ? (
                <select
                  value={editFormData.gender || 'PREFER_NOT_TO_SAY'}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              ) : (
                <p className="font-bold text-slate-900">{employee.gender || '—'}</p>
              )}
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">Marital Status</label>
              {isEditing && isAdminOrHR ? (
                <select
                  value={editFormData.maritalStatus || 'SINGLE'}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, maritalStatus: e.target.value as any })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              ) : (
                <p className="font-bold text-slate-900">{employee.maritalStatus || '—'}</p>
              )}
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">Nationality</label>
              {isEditing && isAdminOrHR ? (
                <input
                  type="text"
                  value={editFormData.nationality || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, nationality: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900">{employee.nationality || '—'}</p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-slate-500 font-semibold block mb-1">
                Residential Address {isEditing && <span className="text-indigo-600">(Editable)</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900">{employee.address || '—'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SALARY & COMPENSATION TAB */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Wage Overview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Salary Profile</h3>
                <p className="text-xs text-slate-500">
                  {isAdminOrHR
                    ? 'Admin salary structure & wage configuration'
                    : 'Read-only summary of your monthly wage structure'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Base Currency:</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                  {salaryProfile?.currency === 'USD' ? 'INR' : (salaryProfile?.currency || 'INR')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Monthly Base Wage
                </p>
                {isEditing && isAdminOrHR ? (
                  <input
                    type="number"
                    value={editWage}
                    onChange={(e) => setEditWage(Number(e.target.value))}
                    className="w-full border border-indigo-400 rounded-lg px-2.5 py-1 text-base font-black text-indigo-600 bg-white"
                  />
                ) : (
                  <p className="text-2xl font-black text-indigo-600">
                    {formatCurrency(monthlyWage, salaryProfile?.currency)}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Annualized Wage
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency((isEditing ? editWage : monthlyWage) * 12, salaryProfile?.currency)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Working Policy
                </p>
                <p className="text-base font-bold text-slate-800">
                  {salaryProfile?.workingDaysPerWeek || 5} Days / Week
                </p>
                <p className="text-[11px] text-slate-400">8.0 hrs standard shift</p>
              </div>
            </div>
          </div>

          {/* Salary Components Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Configured Earnings & Deductions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Component Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Computation Method</th>
                    <th className="py-3 px-4 text-right">Computed Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryComponents.map((comp) => {
                    let amount = 0;
                    if (comp.calculationMethod === 'PERCENTAGE') {
                      const base = comp.percentageBase === 'BASIC_SALARY' ? basicSalary : monthlyWage;
                      amount = (base * comp.value) / 100;
                    } else {
                      amount = comp.value;
                    }

                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{comp.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full font-semibold text-[10px]',
                              comp.isEarning && 'bg-emerald-50 text-emerald-700',
                              comp.isDeduction && 'bg-rose-50 text-rose-700',
                              comp.type === 'EMPLOYER_CONTRIBUTION' && 'bg-blue-50 text-blue-700'
                            )}
                          >
                            {comp.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {comp.calculationMethod === 'PERCENTAGE'
                            ? `${comp.value}% of ${comp.percentageBase.replace('_', ' ')}`
                            : 'Fixed Amount'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {comp.isDeduction && '- '}
                          {formatCurrency(amount, salaryProfile?.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY & ACCOUNT TAB */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Account Security & Master Access Authority
            </h3>
            {isAdmin && employee.employmentStatus !== 'TERMINATED' && (
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Manage Login ID & Password</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            {/* Login ID Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Login ID</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Unique enterprise credential used for workstation authentication.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-indigo-900 text-xs break-all">
                  {employee.loginId || employee.employeeId}
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="mt-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 text-left"
                >
                  Edit Login ID →
                </button>
              )}
            </div>

            {/* Password Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Password Credentials</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  {isAdmin ? 'Admins can view, copy, and change passwords.' : 'Trigger password recovery to registered email.'}
                </p>
                {isAdmin ? (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-800 text-xs flex items-center justify-between gap-2">
                    <span className="truncate">
                      {showPasswordAdmin ? (employee.password || 'password @2026') : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPasswordAdmin(!showPasswordAdmin)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title={showPasswordAdmin ? 'Hide password' : 'Show password'}
                      >
                        {showPasswordAdmin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(employee.password || 'password @2026');
                          showToast('Password copied to clipboard', 'success');
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-800 rounded transition-colors"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Send Reset Email</span>
                  </button>
                )}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="mt-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 text-left"
                >
                  Change / Edit Password →
                </button>
              )}
            </div>

            {/* Role Authority Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Assigned System Authority</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Role governing approvals, offboarding permissions, and records access.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-800 font-bold text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {employee.department.includes('Human')
                      ? 'HR OFFICER'
                      : employee.designation.toLowerCase().includes('admin') || employee.employeeId === 'DAYFLOW-AM2023-001'
                      ? 'ADMINISTRATOR'
                      : 'EMPLOYEE'}
                  </span>
                </div>
              </div>

              {isAdmin && employee.employmentStatus !== 'TERMINATED' && (
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="mt-3 text-[11px] font-bold text-purple-700 hover:text-purple-900 text-left"
                >
                  Change Role (HR / Employee) →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offboarding / Removal Modal */}
      <RequestRemovalModal
        isOpen={isRemovalModalOpen}
        onClose={() => setIsRemovalModalOpen(false)}
        employee={employee}
        onSuccess={() => {
          fetchProfileData();
        }}
      />

      {/* Admin User Role & Credential Modal */}
      <AdminUserCredentialModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        employee={employee}
        onSuccess={() => {
          fetchProfileData();
        }}
      />

      {/* Document Upload Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Document</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add employment contracts, certifications, or tax records.
            </p>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Identity_Proof_Passport"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="RESUME">Resume / CV</option>
                  <option value="CONTRACT">Employment Contract</option>
                  <option value="ID_PROOF">Government ID / Passport</option>
                  <option value="CERTIFICATE">Academic / Skill Certificate</option>
                  <option value="TAX_DOCUMENT">Tax Withholding Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
