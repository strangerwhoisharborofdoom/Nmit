import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS, DEMO_EMPLOYEES } from '../../services/seedData';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { currentUser, currentEmployee, role, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const isAdminOrHR = role === 'ADMIN' || role === 'HR';

  const navLinks = isAdminOrHR
    ? [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/employees', label: 'Employees', icon: Users },
        { to: '/admin/attendance', label: 'Attendance', icon: Clock },
        { to: '/admin/time-off', label: 'Time Off', icon: Calendar },
        { to: '/admin/payroll', label: 'Payroll', icon: DollarSign },
        { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
        { to: '/admin/settings', label: 'Settings', icon: Settings },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
      ]
    : [
        { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/employee/profile', label: 'My Profile', icon: UserIcon },
        { to: '/employee/attendance', label: 'Attendance', icon: Clock },
        { to: '/employee/time-off', label: 'Time Off', icon: Calendar },
        { to: '/employee/salary', label: 'Salary', icon: DollarSign },
        { to: '/employee/documents', label: 'Documents', icon: FileText },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchPersona = async (email: string) => {
    await loginAsDemo(email);
    setIsDemoSwitcherOpen(false);
    // Redirect appropriately
    const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched?.role === 'ADMIN' || matched?.role === 'HR') {
      navigate('/admin/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <NavLink
                to={isAdminOrHR ? '/admin/dashboard' : '/employee/dashboard'}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1.5">
                    Dayflow <span className="text-xs font-semibold text-indigo-600 px-1.5 py-0.2 bg-indigo-50 border border-indigo-100 rounded-md">HRMS</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Enterprise Suite</span>
                </div>
              </NavLink>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        )
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Demo Persona Switcher (Crucial for Reviewers & Testing) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoSwitcherOpen(!isDemoSwitcherOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs',
                    role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      : role === 'HR'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  )}
                  title="Switch Demo Role & Persona"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Role:</span>
                  <span className="uppercase">{role}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
                </button>

                {isDemoSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Quick Demo Persona Switcher
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1 space-y-1">
                      {DEMO_EMPLOYEES.map((emp) => {
                        const userMatch = DEMO_USERS.find((u) => u.email === emp.email);
                        const isCurrent = currentUser?.email === emp.email;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleSwitchPersona(emp.email)}
                            className={cn(
                              'w-full text-left flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors',
                              isCurrent
                                ? 'bg-indigo-50 text-indigo-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            )}
                          >
                            <img
                              src={emp.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={emp.fullName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{emp.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{emp.designation}</p>
                            </div>
                            <span
                              className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                                userMatch?.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700'
                                  : userMatch?.role === 'HR'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {userMatch?.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              </button>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsDemoSwitcherOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={
                      currentEmployee?.profilePictureUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={currentEmployee?.fullName || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-1 ring-slate-200"
                  />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-28">
                      {currentEmployee?.fullName || 'Alex Morgan'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {currentEmployee?.employeeId || 'DAYFLOW-001'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentEmployee?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                      <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                        {currentEmployee?.designation}
                      </p>
                    </div>

                    <NavLink
                      to={isAdminOrHR ? '/admin/employees' : '/employee/profile'}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>{isAdminOrHR ? 'Manage Employees' : 'View My Profile'}</span>
                    </NavLink>

                    {isAdminOrHR && (
                      <NavLink
                        to="/admin/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>System Settings</span>
                      </NavLink>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Notifications Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
