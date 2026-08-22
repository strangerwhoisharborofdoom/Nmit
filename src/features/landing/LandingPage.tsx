import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { dayflowDb } from '../../services/db';
import { Department } from '../../types';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  Briefcase,
  Building,
  User,
  Phone,
  Sparkles,
  Key,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  UserPlus,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, signUpEmployee, signUpCompanyAdmin, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  useEffect(() => {
    dayflowDb.getDepartments().then((depts) => {
      setAvailableDepartments(depts);
      if (depts.length > 0 && !depts.some((d) => d.name === empDepartment)) {
        setEmpDepartment(depts[0].name);
      }
    });
  }, []);

  // Navigation tab mode: 'signin' | 'employee_signup' | 'admin_signup'
  const [authMode, setAuthMode] = useState<'signin' | 'employee_signup' | 'admin_signup'>('signin');

  // Role selector for Sign In: 'ALL' | 'ADMIN' | 'HR' | 'EMPLOYEE'
  const [selectedRoleTab, setSelectedRoleTab] = useState<'ADMIN' | 'HR' | 'EMPLOYEE'>('ADMIN');

  // Sign in state
  const [identifier, setIdentifier] = useState('Admin');
  const [password, setPassword] = useState('password @2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Employee Self Sign-up state
  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Engineering');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empPassword, setEmpPassword] = useState('password @2026');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('password @2026');
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // Company Admin Sign up state
  const [companyName, setCompanyName] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('password @2026');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('password @2026');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleRoleTabChange = (role: 'ADMIN' | 'HR' | 'EMPLOYEE') => {
    setSelectedRoleTab(role);
    if (role === 'ADMIN') {
      setIdentifier('Admin');
      setPassword('password @2026');
    } else if (role === 'HR') {
      setIdentifier('HR');
      setPassword('password @2026');
    } else {
      setIdentifier('');
      setPassword('');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter both Login ID / Email and password', 'error');
      return;
    }

    setIsLoading(true);
    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      showToast('Authentication successful! Welcome to Dayflow.', 'success');
      navigate('/admin/employees');
    } else {
      showToast(res.message || 'Invalid credentials', 'error');
    }
  };

  const handleEmployeeSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName.trim() || !empEmail.trim()) {
      showToast('Please fill in your Full Name and Work Email', 'error');
      return;
    }
    if (!empPassword.trim()) {
      showToast('Please create a password', 'error');
      return;
    }
    if (empPassword !== empConfirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    const res = await signUpEmployee({
      fullName: empFullName.trim(),
      email: empEmail.trim(),
      phone: empPhone.trim(),
      department: empDepartment,
      designation: empDesignation.trim() || 'Software Engineer',
      password: empPassword.trim(),
      company: 'Dayflow Technologies',
    });
    setIsLoading(false);

    if (res.success) {
      showToast(res.message || 'Account created successfully!', 'success');
      navigate('/admin/employees');
    } else {
      showToast(res.message || 'Sign up failed', 'error');
    }
  };

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminFullName.trim() || !adminEmail.trim()) {
      showToast('Please fill in Company Name, Full Name, and Work Email', 'error');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    const res = await signUpCompanyAdmin({
      companyName,
      name: adminFullName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
    });
    setIsLoading(false);

    if (res.success) {
      showToast(res.message || 'Workspace created successfully!', 'success');
      navigate('/admin/employees');
    } else {
      showToast(res.message || 'Sign up failed', 'error');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email', 'error');
      return;
    }
    showToast(`Password recovery link sent to ${forgotEmail}`, 'info', 'Email Sent');
    setIsForgotPasswordOpen(false);
    setForgotEmail('');
  };

  return (
    <div id="landing_page_container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header id="landing_header" className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">Dayflow HRMS</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Enterprise v2.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="header_toggle_auth_mode_btn"
              type="button"
              onClick={() => setAuthMode(authMode === 'signin' ? 'employee_signup' : 'signin')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              {authMode === 'signin' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Create Employee Account</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Back to Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="landing_main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center flex-1">
        {/* Left Column: Hero & Key Highlights */}
        <div id="landing_hero_section" className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Human Resource & Attendance System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Role-Based Access for{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-300 to-emerald-400">
                Admin, HR & Employees
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Dedicated portals with streamlined authentication. Employees create their own profiles, while Administrators have complete authority to manage, view, and update all user credentials.
            </p>
          </div>

          {/* Quick Capability Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white mb-1">Admin Portal</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Full authority over employee records, role assignment, and credential updates.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white mb-1">HR Officer</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Approve leaves, monitor attendance, and review workforce payroll records.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white mb-1">Employee Self-Service</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Create your account, log work attendance, request leaves, and download payslips.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Login & Registration Container */}
        <div id="auth_form_container" className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
            {/* Main Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <button
                  id="tab_signin_btn"
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'signin'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="tab_emp_signup_btn"
                  type="button"
                  onClick={() => setAuthMode('employee_signup')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'employee_signup'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Employee Sign Up
                </button>
                <button
                  id="tab_admin_signup_btn"
                  type="button"
                  onClick={() => setAuthMode('admin_signup')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hidden sm:inline-block ${
                    authMode === 'admin_signup'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Company Sign Up
                </button>
              </div>

              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {authMode === 'signin'
                  ? 'Portal Access'
                  : authMode === 'employee_signup'
                  ? 'New Employee'
                  : 'New Workspace'}
              </span>
            </div>

            {/* 1. SIGN IN FLOW */}
            {authMode === 'signin' && (
              <div className="space-y-4">
                {/* Role Specific Selection Tabs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Your Role Portal :-
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Admin Tab */}
                    <button
                      id="role_tab_admin_btn"
                      type="button"
                      onClick={() => handleRoleTabChange('ADMIN')}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedRoleTab === 'ADMIN'
                          ? 'border-purple-500 bg-purple-950/40 text-white ring-1 ring-purple-500/30'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Shield className={`w-3.5 h-3.5 ${selectedRoleTab === 'ADMIN' ? 'text-purple-400' : 'text-slate-500'}`} />
                        {selectedRoleTab === 'ADMIN' && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-xs text-white">Admin</span>
                        <span className="text-[10px] text-slate-400">Master Control</span>
                      </div>
                    </button>

                    {/* HR Tab */}
                    <button
                      id="role_tab_hr_btn"
                      type="button"
                      onClick={() => handleRoleTabChange('HR')}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedRoleTab === 'HR'
                          ? 'border-blue-500 bg-blue-950/40 text-white ring-1 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Briefcase className={`w-3.5 h-3.5 ${selectedRoleTab === 'HR' ? 'text-blue-400' : 'text-slate-500'}`} />
                        {selectedRoleTab === 'HR' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-xs text-white">HR Officer</span>
                        <span className="text-[10px] text-slate-400">Leaves & Records</span>
                      </div>
                    </button>

                    {/* Employee Tab */}
                    <button
                      id="role_tab_employee_btn"
                      type="button"
                      onClick={() => handleRoleTabChange('EMPLOYEE')}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedRoleTab === 'EMPLOYEE'
                          ? 'border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <UserCheck className={`w-3.5 h-3.5 ${selectedRoleTab === 'EMPLOYEE' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        {selectedRoleTab === 'EMPLOYEE' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-xs text-white">Employee</span>
                        <span className="text-[10px] text-slate-400">Self-Service</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <form id="signin_form" onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Login ID / Email :-
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        id="signin_identifier_input"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={
                          selectedRoleTab === 'ADMIN'
                            ? 'Admin'
                            : selectedRoleTab === 'HR'
                            ? 'HR'
                            : 'Enter your Login ID or Work Email'
                        }
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">Password :-</label>
                      <button
                        id="forgot_password_btn"
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        id="signin_password_input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                        required
                      />
                      <button
                        id="toggle_password_visibility_btn"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit_signin_btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 text-xs tracking-wider uppercase"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>SIGN IN AS {selectedRoleTab}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>New to Dayflow?</span>
                    <button
                      id="switch_to_emp_signup_link"
                      type="button"
                      onClick={() => setAuthMode('employee_signup')}
                      className="text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Create Employee Account</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. EMPLOYEE SELF-REGISTRATION FLOW */}
            {authMode === 'employee_signup' && (
              <form id="employee_signup_form" onSubmit={handleEmployeeSignUp} className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 mb-3">
                  <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Employee Self-Registration</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Create your profile. An official standard Login ID will be generated automatically, and your credentials can be viewed/managed by your Admin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Full Name :-</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="emp_signup_fullname"
                        type="text"
                        value={empFullName}
                        onChange={(e) => setEmpFullName(e.target.value)}
                        placeholder="e.g. Jordan Miller"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Work Email :-</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="emp_signup_email"
                        type="email"
                        value={empEmail}
                        onChange={(e) => setEmpEmail(e.target.value)}
                        placeholder="jordan@dayflow.io"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Department :-</label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <select
                        id="emp_signup_department"
                        value={empDepartment}
                        onChange={(e) => setEmpDepartment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      >
                        {availableDepartments.length > 0 ? (
                          availableDepartments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name} ({dept.code})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Engineering">Engineering</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="Finance & Accounts">Finance & Accounts</option>
                            <option value="Product & Design">Product & Design</option>
                            <option value="Operations & Sales">Operations & Sales</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Designation Title :-</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="emp_signup_designation"
                        type="text"
                        value={empDesignation}
                        onChange={(e) => setEmpDesignation(e.target.value)}
                        placeholder="e.g. Frontend Engineer"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone Number (Optional) :-</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="emp_signup_phone"
                      type="tel"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      placeholder="+1 (555) 000-1234"
                      className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Password :-</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="emp_signup_password"
                        type={showEmpPassword ? 'text' : 'password'}
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmpPassword(!showEmpPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showEmpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Confirm Password :-</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="emp_signup_confirm_password"
                        type={showEmpPassword ? 'text' : 'password'}
                        value={empConfirmPassword}
                        onChange={(e) => setEmpConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="submit_employee_signup_btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>CREATE EMPLOYEE ACCOUNT</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-xs text-slate-400 hover:text-indigo-300 font-medium"
                  >
                    Already registered? <span className="text-indigo-400 font-bold underline">Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. COMPANY WORKSPACE SIGN UP FLOW */}
            {authMode === 'admin_signup' && (
              <form id="admin_signup_form" onSubmit={handleAdminSignUp} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Company Name :-</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="company_signup_name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Administrator Name :-</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="admin_signup_fullname"
                        type="text"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Work Email :-</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="admin_signup_email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@company.com"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Password :-</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="admin_signup_password"
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Confirm Password :-</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="admin_signup_confirm_password"
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="submit_admin_signup_btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>CREATE COMPANY WORKSPACE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-xs text-slate-400 hover:text-indigo-300 font-medium"
                  >
                    Already have an account? <span className="text-indigo-400 font-bold underline">Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing_footer" className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Dayflow HRMS • Enterprise Human Resource Management Suite</p>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div id="forgot_password_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered work email to receive password recovery instructions.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
