import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  User,
  Employee,
  Attendance,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  SalaryProfile,
  SalaryComponent,
  Payslip,
  EmployeeDocument,
  Notification,
  AuditLog,
  SystemSettings,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_LEAVE_TYPES,
  INITIAL_SALARY_COMPONENTS,
  DEMO_USERS,
  DEMO_EMPLOYEES,
  DEMO_SALARY_PROFILES,
  DEMO_LEAVE_BALANCES,
  DEMO_LEAVE_REQUESTS,
  DEMO_ATTENDANCE,
  DEMO_DOCUMENTS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
} from './seedData';

// Storage cache keys for instant offline/fallback resilience
const STORAGE_PREFIX = 'dayflow_db_';

function getLocalStore<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStore<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

export class DayflowDbService {
  private initialized = false;

  async initializeDb(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if firestore has employees
      const empSnap = await getDocs(collection(db, 'employees'));
      if (empSnap.empty) {
        console.log('Seeding initial Firestore database with demo datasets...');
        await this.seedAllData();
      }
      this.initialized = true;
    } catch (err) {
      console.warn('Firestore initial check encountered warning/offline, initializing local memory store:', err);
      this.seedLocalFallback();
      this.initialized = true;
    }
  }

  private seedLocalFallback() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'employees')) {
      setLocalStore('settings', INITIAL_SETTINGS);
      setLocalStore('leaveTypes', INITIAL_LEAVE_TYPES);
      setLocalStore('salaryComponents', INITIAL_SALARY_COMPONENTS);
      setLocalStore('users', DEMO_USERS);
      setLocalStore('employees', DEMO_EMPLOYEES);
      setLocalStore('salaryProfiles', DEMO_SALARY_PROFILES);
      setLocalStore('leaveBalances', DEMO_LEAVE_BALANCES);
      setLocalStore('leaveRequests', DEMO_LEAVE_REQUESTS);
      setLocalStore('attendance', DEMO_ATTENDANCE);
      setLocalStore('documents', DEMO_DOCUMENTS);
      setLocalStore('notifications', DEMO_NOTIFICATIONS);
      setLocalStore('auditLogs', DEMO_AUDIT_LOGS);
    }
  }

  async seedAllData(): Promise<void> {
    this.seedLocalFallback();
    try {
      // Seed System Settings
      await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);

      // Seed Leave Types
      for (const lt of INITIAL_LEAVE_TYPES) {
        await setDoc(doc(db, 'leaveTypes', lt.id), lt);
      }

      // Seed Salary Components
      for (const sc of INITIAL_SALARY_COMPONENTS) {
        await setDoc(doc(db, 'salaryComponents', sc.id), sc);
      }

      // Seed Users
      for (const u of DEMO_USERS) {
        await setDoc(doc(db, 'users', u.uid), u);
      }

      // Seed Employees
      for (const emp of DEMO_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.employeeId), emp);
      }

      // Seed Salary Profiles
      for (const sp of DEMO_SALARY_PROFILES) {
        await setDoc(doc(db, 'salaryProfiles', sp.employeeId), sp);
      }

      // Seed Leave Balances
      for (const lb of DEMO_LEAVE_BALANCES) {
        await setDoc(doc(db, 'leaveBalances', lb.id), lb);
      }

      // Seed Leave Requests
      for (const lr of DEMO_LEAVE_REQUESTS) {
        await setDoc(doc(db, 'leaveRequests', lr.id), lr);
      }

      // Seed Attendance
      for (const att of DEMO_ATTENDANCE) {
        await setDoc(doc(db, 'attendance', att.id), att);
      }

      // Seed Documents
      for (const docItem of DEMO_DOCUMENTS) {
        await setDoc(doc(db, 'employeeDocuments', docItem.id), docItem);
      }

      // Seed Notifications
      for (const notif of DEMO_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }

      // Seed Audit Logs
      for (const log of DEMO_AUDIT_LOGS) {
        await setDoc(doc(db, 'auditLogs', log.id), log);
      }
    } catch (err) {
      console.warn('Firestore seeding error (running in local mode):', err);
    }
  }

  async resetToSeedData(): Promise<void> {
    localStorage.removeItem(STORAGE_PREFIX + 'settings');
    localStorage.removeItem(STORAGE_PREFIX + 'leaveTypes');
    localStorage.removeItem(STORAGE_PREFIX + 'salaryComponents');
    localStorage.removeItem(STORAGE_PREFIX + 'users');
    localStorage.removeItem(STORAGE_PREFIX + 'employees');
    localStorage.removeItem(STORAGE_PREFIX + 'salaryProfiles');
    localStorage.removeItem(STORAGE_PREFIX + 'leaveBalances');
    localStorage.removeItem(STORAGE_PREFIX + 'leaveRequests');
    localStorage.removeItem(STORAGE_PREFIX + 'attendance');
    localStorage.removeItem(STORAGE_PREFIX + 'documents');
    localStorage.removeItem(STORAGE_PREFIX + 'notifications');
    localStorage.removeItem(STORAGE_PREFIX + 'auditLogs');
    localStorage.removeItem(STORAGE_PREFIX + 'payslips');
    await this.seedAllData();
  }

  // --- SYSTEM SETTINGS ---
  async getSettings(): Promise<SystemSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        const data = snap.data() as SystemSettings;
        setLocalStore('settings', data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getSettings err:', err);
    }
    return getLocalStore<SystemSettings>('settings', INITIAL_SETTINGS);
  }

  async saveSettings(settings: SystemSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (err) {
      console.warn('Firestore saveSettings err:', err);
    }
    setLocalStore('settings', settings);
  }

  // --- USERS ---
  async getUser(uid: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (err) {
      console.warn('Firestore getUser err:', err);
    }
    const all = getLocalStore<User[]>('users', DEMO_USERS);
    return all.find((u) => u.uid === uid) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
    } catch (err) {
      console.warn('Firestore getUserByEmail err:', err);
    }
    const all = getLocalStore<User[]>('users', DEMO_USERS);
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async saveUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.uid), user);
    } catch (err) {
      console.warn('Firestore saveUser err:', err);
    }
    const all = getLocalStore<User[]>('users', DEMO_USERS);
    const idx = all.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) all[idx] = user;
    else all.push(user);
    setLocalStore('users', all);
  }

  // --- EMPLOYEES ---
  async getEmployees(): Promise<Employee[]> {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Employee);
        setLocalStore('employees', list);
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      }
    } catch (err) {
      console.warn('Firestore getEmployees err:', err);
    }
    return getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES).sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const snap = await getDoc(doc(db, 'employees', employeeId));
      if (snap.exists()) {
        return snap.data() as Employee;
      }
    } catch (err) {
      console.warn('Firestore getEmployeeById err:', err);
    }
    const all = getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES);
    return all.find((e) => e.employeeId === employeeId || e.id === employeeId) || null;
  }

  async getEmployeeByUid(uid: string): Promise<Employee | null> {
    try {
      const q = query(collection(db, 'employees'), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Employee;
      }
    } catch (err) {
      console.warn('Firestore getEmployeeByUid err:', err);
    }
    const all = getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES);
    return all.find((e) => e.uid === uid) || null;
  }

  async saveEmployee(employee: Employee, actor?: { id: string; name: string; role: any }): Promise<void> {
    try {
      await setDoc(doc(db, 'employees', employee.employeeId), employee);
    } catch (err) {
      console.warn('Firestore saveEmployee err:', err);
    }
    const all = getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES);
    const idx = all.findIndex((e) => e.employeeId === employee.employeeId);
    const isNew = idx < 0;
    if (idx >= 0) all[idx] = employee;
    else all.push(employee);
    setLocalStore('employees', all);

    if (actor) {
      await this.logAudit({
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: isNew ? 'EMPLOYEE_CREATED' : 'EMPLOYEE_UPDATED',
        entityType: 'Employee',
        entityId: employee.employeeId,
        newValue: `${employee.fullName} (${employee.designation}, ${employee.department})`,
      });
    }
  }

  // --- ATTENDANCE ---
  async getAttendance(employeeId?: string, monthStr?: string): Promise<Attendance[]> {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as Attendance);
        setLocalStore('attendance', list);
        if (employeeId) list = list.filter((a) => a.employeeId === employeeId);
        if (monthStr) list = list.filter((a) => a.date.startsWith(monthStr));
        return list.sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch (err) {
      console.warn('Firestore getAttendance err:', err);
    }
    let list = getLocalStore<Attendance[]>('attendance', DEMO_ATTENDANCE);
    if (employeeId) list = list.filter((a) => a.employeeId === employeeId);
    if (monthStr) list = list.filter((a) => a.date.startsWith(monthStr));
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveAttendance(attendance: Attendance): Promise<void> {
    try {
      await setDoc(doc(db, 'attendance', attendance.id), attendance);
    } catch (err) {
      console.warn('Firestore saveAttendance err:', err);
    }
    const all = getLocalStore<Attendance[]>('attendance', DEMO_ATTENDANCE);
    const idx = all.findIndex((a) => a.id === attendance.id);
    if (idx >= 0) all[idx] = attendance;
    else all.push(attendance);
    setLocalStore('attendance', all);
  }

  // --- LEAVE TYPES & BALANCES ---
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const snap = await getDocs(collection(db, 'leaveTypes'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as LeaveType);
        setLocalStore('leaveTypes', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getLeaveTypes err:', err);
    }
    return getLocalStore<LeaveType[]>('leaveTypes', INITIAL_LEAVE_TYPES);
  }

  async saveLeaveType(type: LeaveType): Promise<void> {
    try {
      await setDoc(doc(db, 'leaveTypes', type.id), type);
    } catch (err) {
      console.warn('Firestore saveLeaveType err:', err);
    }
    const all = getLocalStore<LeaveType[]>('leaveTypes', INITIAL_LEAVE_TYPES);
    const idx = all.findIndex((t) => t.id === type.id);
    if (idx >= 0) all[idx] = type;
    else all.push(type);
    setLocalStore('leaveTypes', all);
  }

  async getLeaveBalances(employeeId: string, year: number = 2026): Promise<LeaveBalance[]> {
    try {
      const snap = await getDocs(collection(db, 'leaveBalances'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as LeaveBalance);
        setLocalStore('leaveBalances', list);
        list = list.filter((b) => b.employeeId === employeeId && b.year === year);
        if (list.length > 0) return list;
      }
    } catch (err) {
      console.warn('Firestore getLeaveBalances err:', err);
    }
    let all = getLocalStore<LeaveBalance[]>('leaveBalances', DEMO_LEAVE_BALANCES);
    let userBals = all.filter((b) => b.employeeId === employeeId && b.year === year);

    // If user has no balance records seeded yet, generate defaults
    if (userBals.length === 0) {
      const types = await this.getLeaveTypes();
      const generated = types.map((t) => ({
        id: `bal-${employeeId}-${t.id}-${year}`,
        employeeId,
        leaveTypeId: t.id,
        leaveTypeName: t.name,
        leaveTypeCode: t.code,
        year,
        allocated: t.defaultDays || t.annualAllocation || 10,
        used: 0,
        pending: 0,
        remaining: t.defaultDays || t.annualAllocation || 10,
      }));
      for (const g of generated) {
        all.push(g);
      }
      setLocalStore('leaveBalances', all);
      userBals = generated;
    }
    return userBals;
  }

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    try {
      await setDoc(doc(db, 'leaveBalances', balance.id), balance);
    } catch (err) {
      console.warn('Firestore saveLeaveBalance err:', err);
    }
    const all = getLocalStore<LeaveBalance[]>('leaveBalances', DEMO_LEAVE_BALANCES);
    const idx = all.findIndex((b) => b.id === balance.id);
    if (idx >= 0) all[idx] = balance;
    else all.push(balance);
    setLocalStore('leaveBalances', all);
  }

  // --- LEAVE REQUESTS ---
  async getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    try {
      const snap = await getDocs(collection(db, 'leaveRequests'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as LeaveRequest);
        setLocalStore('leaveRequests', list);
        if (employeeId) list = list.filter((r) => r.employeeId === employeeId);
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.warn('Firestore getLeaveRequests err:', err);
    }
    let list = getLocalStore<LeaveRequest[]>('leaveRequests', DEMO_LEAVE_REQUESTS);
    if (employeeId) list = list.filter((r) => r.employeeId === employeeId);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    try {
      await setDoc(doc(db, 'leaveRequests', request.id), request);
    } catch (err) {
      console.warn('Firestore saveLeaveRequest err:', err);
    }
    const all = getLocalStore<LeaveRequest[]>('leaveRequests', DEMO_LEAVE_REQUESTS);
    const idx = all.findIndex((r) => r.id === request.id);
    if (idx >= 0) all[idx] = request;
    else all.push(request);
    setLocalStore('leaveRequests', all);
  }

  // --- SALARY PROFILES & COMPONENTS ---
  async getSalaryComponents(): Promise<SalaryComponent[]> {
    try {
      const snap = await getDocs(collection(db, 'salaryComponents'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as SalaryComponent);
        setLocalStore('salaryComponents', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getSalaryComponents err:', err);
    }
    return getLocalStore<SalaryComponent[]>('salaryComponents', INITIAL_SALARY_COMPONENTS);
  }

  async saveSalaryComponent(comp: SalaryComponent): Promise<void> {
    try {
      await setDoc(doc(db, 'salaryComponents', comp.id), comp);
    } catch (err) {
      console.warn('Firestore saveSalaryComponent err:', err);
    }
    const all = getLocalStore<SalaryComponent[]>('salaryComponents', INITIAL_SALARY_COMPONENTS);
    const idx = all.findIndex((c) => c.id === comp.id);
    if (idx >= 0) all[idx] = comp;
    else all.push(comp);
    setLocalStore('salaryComponents', all);
  }

  async getSalaryProfile(employeeId: string): Promise<SalaryProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'salaryProfiles', employeeId));
      if (docSnap.exists()) {
        return docSnap.data() as SalaryProfile;
      }
    } catch (err) {
      console.warn('Firestore getSalaryProfile err:', err);
    }
    const all = getLocalStore<SalaryProfile[]>('salaryProfiles', DEMO_SALARY_PROFILES);
    return all.find((p) => p.employeeId === employeeId) || null;
  }

  async getSalaryProfiles(): Promise<SalaryProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'salaryProfiles'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as SalaryProfile);
        setLocalStore('salaryProfiles', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getSalaryProfiles err:', err);
    }
    return getLocalStore<SalaryProfile[]>('salaryProfiles', DEMO_SALARY_PROFILES);
  }

  async saveSalaryProfile(profile: SalaryProfile, actor?: { id: string; name: string; role: any }): Promise<void> {
    try {
      await setDoc(doc(db, 'salaryProfiles', profile.employeeId), profile);
    } catch (err) {
      console.warn('Firestore saveSalaryProfile err:', err);
    }
    const all = getLocalStore<SalaryProfile[]>('salaryProfiles', DEMO_SALARY_PROFILES);
    const idx = all.findIndex((p) => p.employeeId === profile.employeeId);
    if (idx >= 0) all[idx] = profile;
    else all.push(profile);
    setLocalStore('salaryProfiles', all);

    if (actor) {
      await this.logAudit({
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'SALARY_PROFILE_UPDATED',
        entityType: 'SalaryProfile',
        entityId: profile.employeeId,
        newValue: `Updated Monthly Wage to $${profile.monthlyWage} (Yearly: $${profile.yearlyWage})`,
      });
    }
  }

  // --- PAYSLIPS ---
  async getPayslips(employeeId?: string): Promise<Payslip[]> {
    try {
      const snap = await getDocs(collection(db, 'payslips'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as Payslip);
        setLocalStore('payslips', list);
        if (employeeId) list = list.filter((p) => p.employeeId === employeeId);
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.warn('Firestore getPayslips err:', err);
    }
    let list = getLocalStore<Payslip[]>('payslips', []);
    if (employeeId) list = list.filter((p) => p.employeeId === employeeId);
    return list;
  }

  async savePayslip(payslip: Payslip): Promise<void> {
    try {
      await setDoc(doc(db, 'payslips', payslip.id), payslip);
    } catch (err) {
      console.warn('Firestore savePayslip err:', err);
    }
    const all = getLocalStore<Payslip[]>('payslips', []);
    const idx = all.findIndex((p) => p.id === payslip.id);
    if (idx >= 0) all[idx] = payslip;
    else all.push(payslip);
    setLocalStore('payslips', all);
  }

  async savePayslipsBatch(payslips: Payslip[]): Promise<void> {
    const all = getLocalStore<Payslip[]>('payslips', []);
    for (const ps of payslips) {
      try {
        await setDoc(doc(db, 'payslips', ps.id), ps);
      } catch (err) {
        console.warn('Firestore savePayslip batch err:', err);
      }
      const idx = all.findIndex((p) => p.id === ps.id);
      if (idx >= 0) all[idx] = ps;
      else all.push(ps);
    }
    setLocalStore('payslips', all);
  }

  // --- DOCUMENTS ---
  async getDocuments(employeeId?: string): Promise<EmployeeDocument[]> {
    try {
      const snap = await getDocs(collection(db, 'employeeDocuments'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as EmployeeDocument);
        setLocalStore('documents', list);
        if (employeeId) list = list.filter((d) => d.employeeId === employeeId);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getDocuments err:', err);
    }
    let list = getLocalStore<EmployeeDocument[]>('documents', DEMO_DOCUMENTS);
    if (employeeId) list = list.filter((d) => d.employeeId === employeeId);
    return list;
  }

  async saveDocument(docItem: EmployeeDocument): Promise<void> {
    try {
      await setDoc(doc(db, 'employeeDocuments', docItem.id), docItem);
    } catch (err) {
      console.warn('Firestore saveDocument err:', err);
    }
    const all = getLocalStore<EmployeeDocument[]>('documents', DEMO_DOCUMENTS);
    const idx = all.findIndex((d) => d.id === docItem.id);
    if (idx >= 0) all[idx] = docItem;
    else all.push(docItem);
    setLocalStore('documents', all);
  }

  async deleteDocument(docId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'employeeDocuments', docId));
    } catch (err) {
      console.warn('Firestore deleteDoc err:', err);
    }
    let all = getLocalStore<EmployeeDocument[]>('documents', DEMO_DOCUMENTS);
    all = all.filter((d) => d.id !== docId);
    setLocalStore('documents', all);
  }

  // --- NOTIFICATIONS ---
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as Notification);
        setLocalStore('notifications', list);
        if (userId) list = list.filter((n) => n.recipientUserId === userId || n.recipientUserId === 'ALL_ADMINS');
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.warn('Firestore getNotifications err:', err);
    }
    let list = getLocalStore<Notification[]>('notifications', DEMO_NOTIFICATIONS);
    if (userId) list = list.filter((n) => n.recipientUserId === userId || n.recipientUserId === 'ALL_ADMINS');
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addNotification(notif: Notification): Promise<void> {
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (err) {
      console.warn('Firestore addNotification err:', err);
    }
    const all = getLocalStore<Notification[]>('notifications', DEMO_NOTIFICATIONS);
    all.unshift(notif);
    setLocalStore('notifications', all);
  }

  async markNotificationRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.warn('Firestore markRead err:', err);
    }
    const all = getLocalStore<Notification[]>('notifications', DEMO_NOTIFICATIONS);
    const item = all.find((n) => n.id === id);
    if (item) item.read = true;
    setLocalStore('notifications', all);
  }

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as AuditLog);
        setLocalStore('auditLogs', list);
        return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
    } catch (err) {
      console.warn('Firestore getAuditLogs err:', err);
    }
    return getLocalStore<AuditLog[]>('auditLogs', DEMO_AUDIT_LOGS).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const fullLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'auditLogs', fullLog.id), fullLog);
    } catch (err) {
      console.warn('Firestore logAudit err:', err);
    }

    const all = getLocalStore<AuditLog[]>('auditLogs', DEMO_AUDIT_LOGS);
    all.unshift(fullLog);
    setLocalStore('auditLogs', all);
  }
}

export const dayflowDb = new DayflowDbService();
