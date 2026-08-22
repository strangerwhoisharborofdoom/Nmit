import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dayflowDb } from '../../services/db';
import { SystemSettings, AuditLog } from '../../types';
import { formatDate } from '../../lib/utils';
import { DepartmentManager } from '../departments/DepartmentManager';
import {
  Settings,
  ShieldAlert,
  RotateCcw,
  Save,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Building2,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SettingsAndAudit: React.FC = () => {
  const { currentUser, currentEmployee, role } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'departments' | 'general' | 'audit' | 'database'>('departments');
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'Dayflow Technologies Inc.',
    companyPrefix: 'DAYFLOW',
    employeeIdFormat: 'PREFIX_NAME_YEAR_SEQ',
    workingDaysPerWeek: 5,
    standardShiftHours: 8,
    standardStartTime: '09:00',
    standardEndTime: '17:30',
    defaultCurrency: 'INR',
    enableBiometricSync: false,
    requireLeaveReason: true,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [sett, logs] = await Promise.all([
      dayflowDb.getSettings(),
      dayflowDb.getAuditLogs(),
    ]);
    setSettings(sett);
    setAuditLogs(logs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dayflowDb.saveSettings(settings);
      await dayflowDb.logAudit({
        actorUserId: currentUser?.uid || 'admin',
        actorName: currentEmployee?.fullName || 'HR Admin',
        actorRole: role || 'ADMIN',
        action: 'SETTINGS_UPDATED',
        entityType: 'SystemSettings',
        entityId: 'global-settings',
        newValue: `Updated system policies & configuration parameters`,
      });
      showToast('System settings updated successfully', 'success');
    } catch (err: any) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    await dayflowDb.resetToSeedData();
    setIsResetConfirmOpen(false);
    showToast('Database reset to default enterprise seed state', 'success');
    window.location.reload();
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      (log.newValue && log.newValue.toLowerCase().includes(searchLogQuery.toLowerCase()));

    const matchesEntity =
      selectedEntityFilter === 'ALL' || log.entityType === selectedEntityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Configuration & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure enterprise HR policies, inspect tamper-evident audit logs, and manage data.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs gap-1">
          <button
            id="tab_departments_btn"
            type="button"
            onClick={() => setActiveTab('departments')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'departments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments</span>
          </button>
          <button
            id="tab_general_btn"
            type="button"
            onClick={() => setActiveTab('general')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            HR Policies
          </button>
          <button
            id="tab_audit_btn"
            type="button"
            onClick={() => setActiveTab('audit')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Audit Trail
          </button>
          <button
            id="tab_database_btn"
            type="button"
            onClick={() => setActiveTab('database')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Database Management
          </button>
        </div>
      </div>

      {/* 0. DEPARTMENTS MANAGEMENT */}
      {activeTab === 'departments' && <DepartmentManager />}

      {/* 1. GENERAL HR POLICIES */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enterprise Parameters</h2>
              <p className="text-xs text-slate-500">
                Company identification, employee ID sequence schemes, and shift timing defaults.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee ID Prefix</label>
              <input
                type="text"
                value={settings.companyPrefix}
                onChange={(e) => setSettings({ ...settings, companyPrefix: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee ID Format</label>
              <select
                value={settings.employeeIdFormat}
                onChange={(e) =>
                  setSettings({ ...settings, employeeIdFormat: e.target.value as any })
                }
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="PREFIX_NAME_YEAR_SEQ">
                  Prefix + Initials + Year + Seq (e.g. DAYFLOW-JD2026-001)
                </option>
                <option value="PREFIX_YEAR_SEQ">Prefix + Year + Seq (e.g. DAYFLOW-2026-001)</option>
                <option value="PREFIX_SEQ">Prefix + Seq (e.g. DAYFLOW-001)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Working Days / Week</label>
              <select
                value={settings.workingDaysPerWeek}
                onChange={(e) =>
                  setSettings({ ...settings, workingDaysPerWeek: Number(e.target.value) })
                }
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              >
                <option value={5}>5 Days (Monday - Friday)</option>
                <option value={6}>6 Days (Monday - Saturday)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Currency</label>
              <select
                value={settings.defaultCurrency || 'INR'}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Daily Shift Target Hours</label>
              <input
                type="number"
                value={settings.standardShiftHours}
                onChange={(e) =>
                  setSettings({ ...settings, standardShiftHours: Number(e.target.value) })
                }
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
                min="4"
                max="12"
              />
            </div>
          </div>
        </form>
      )}

      {/* 2. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={selectedEntityFilter}
                onChange={(e) => setSelectedEntityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Entities</option>
                <option value="Employee">Employee</option>
                <option value="Attendance">Attendance</option>
                <option value="LeaveRequest">LeaveRequest</option>
                <option value="SalaryProfile">SalaryProfile</option>
                <option value="PayrollRun">PayrollRun</option>
                <option value="SystemSettings">SystemSettings</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Actor</th>
                    <th className="py-3.5 px-6">Action</th>
                    <th className="py-3.5 px-6">Entity</th>
                    <th className="py-3.5 px-6">Details / Change Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 text-slate-500">
                        {formatDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-6 font-sans">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span>{log.actorName}</span>
                          <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-indigo-600 font-bold">{log.entityType}</td>
                      <td className="py-3.5 px-6 font-sans text-slate-600 max-w-md truncate">
                        {log.newValue || log.entityId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. DATABASE MANAGEMENT */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Database & Fixture State</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reset database collections back to standard seeded demo state if needed.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Reset Database to Pristine Demo State</span>
              </h3>
              <p className="text-xs text-rose-700 mt-1 max-w-xl">
                Restores default sample employees, pre-configured attendance punches, leave balances,
                and salary structures.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset All HRMS Data?"
        message="This will reload the initial demo workforce, salary profiles, and attendance logs. Are you sure?"
        confirmLabel="Yes, Reset Database"
        confirmVariant="danger"
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
