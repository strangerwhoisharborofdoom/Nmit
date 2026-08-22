import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';

// Auth feature
import { Login } from './features/auth/Login';

// Dashboards
import { EmployeeDashboard } from './features/dashboard/EmployeeDashboard';
import { AdminDashboard } from './features/dashboard/AdminDashboard';

// Profiles & Employees
import { EmployeeProfile } from './features/profile/EmployeeProfile';
import { EmployeeList } from './features/employees/EmployeeList';

// Attendance
import { EmployeeAttendance } from './features/attendance/EmployeeAttendance';
import { AdminAttendance } from './features/attendance/AdminAttendance';

// Time Off
import { EmployeeTimeOff } from './features/timeoff/EmployeeTimeOff';
import { AdminTimeOff } from './features/timeoff/AdminTimeOff';

// Payroll
import { EmployeePayslips } from './features/payroll/EmployeePayslips';
import { AdminPayroll } from './features/payroll/AdminPayroll';

// Settings & Audit
import { SettingsAndAudit } from './features/settings/SettingsAndAudit';

// Protected Route Wrapper
const ProtectedLayout: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { currentUser, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Dayflow HRMS session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
};

// Root index redirector
const RootRedirector: React.FC = () => {
  const { currentUser, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading Dayflow HRMS...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN' || role === 'HR') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirector />} />

            {/* Employee Self-Service Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <EmployeeDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedLayout>
                  <EmployeeDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedLayout>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <ProtectedLayout>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/profile/:id"
              element={
                <ProtectedLayout>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/documents"
              element={
                <ProtectedLayout>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedLayout>
                  <EmployeeAttendance />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <ProtectedLayout>
                  <EmployeeAttendance />
                </ProtectedLayout>
              }
            />
            <Route
              path="/time-off"
              element={
                <ProtectedLayout>
                  <EmployeeTimeOff />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/time-off"
              element={
                <ProtectedLayout>
                  <EmployeeTimeOff />
                </ProtectedLayout>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedLayout>
                  <EmployeePayslips />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/payroll"
              element={
                <ProtectedLayout>
                  <EmployeePayslips />
                </ProtectedLayout>
              }
            />
            <Route
              path="/employee/salary"
              element={
                <ProtectedLayout>
                  <EmployeePayslips />
                </ProtectedLayout>
              }
            />

            {/* Admin / HR Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <AdminDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <AdminDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <EmployeeList />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/employees/:id"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <EmployeeProfile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <AdminAttendance />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/time-off"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <AdminTimeOff />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/payroll"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <AdminPayroll />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <SettingsAndAudit />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'HR']}>
                  <SettingsAndAudit />
                </ProtectedLayout>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
