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
  EmployeeRemovalRequest,
  UserRole,
  Department,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_LEAVE_TYPES,
  INITIAL_SALARY_COMPONENTS,
  INITIAL_DEPARTMENTS,
  DEMO_USERS,
  DEMO_EMPLOYEES,
  DEMO_SALARY_PROFILES,
  DEMO_LEAVE_BALANCES,
  DEMO_LEAVE_REQUESTS,
  DEMO_ATTENDANCE,
  DEMO_DOCUMENTS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
  DEMO_REMOVAL_REQUESTS,
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

    // Always seed local fallback immediately so user interface is instant
    this.seedLocalFallback();

    try {
      // Check if firestore has employees with a safe timeout
      const fetchWithTimeout = Promise.race([
        getDocs(collection(db, 'employees')),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 2500)
        ),
      ]);

      const empSnap = await fetchWithTimeout;
      if (empSnap && empSnap.empty) {
        console.log('Seeding initial Firestore database with demo datasets...');
        await this.seedAllData();
      }
      this.initialized = true;
    } catch (err) {
      // Seamless offline operation mode
      this.initialized = true;
    }
  }

  private seedLocalFallback() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'employees')) {
      setLocalStore('settings', INITIAL_SETTINGS);
      setLocalStore('departments', INITIAL_DEPARTMENTS);
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
      setLocalStore('removalRequests', DEMO_REMOVAL_REQUESTS);
    } else if (!localStorage.getItem(STORAGE_PREFIX + 'departments')) {
      setLocalStore('departments', INITIAL_DEPARTMENTS);
    }
  }

  async seedAllData(): Promise<void> {
    this.seedLocalFallback();
    try {
      // Seed System Settings
      await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);

      // Seed Departments
      for (const d of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, 'departments', d.id), d);
      }

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

      // Seed Removal Requests
      for (const req of DEMO_REMOVAL_REQUESTS) {
        await setDoc(doc(db, 'removalRequests', req.id), req);
      }
    } catch (err) {
      console.warn('Firestore seeding error (running in local mode):', err);
    }
  }

  async resetToSeedData(): Promise<void> {
    localStorage.removeItem(STORAGE_PREFIX + 'settings');
    localStorage.removeItem(STORAGE_PREFIX + 'departments');
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
    localStorage.removeItem(STORAGE_PREFIX + 'removalRequests');
    await this.seedAllData();
  }

  // --- DEPARTMENTS ---
  async getDepartments(): Promise<Department[]> {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Department);
        setLocalStore('departments', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getDepartments err:', err);
    }
    return getLocalStore<Department[]>('departments', INITIAL_DEPARTMENTS);
  }

  async getDepartment(id: string): Promise<Department | null> {
    const list = await this.getDepartments();
    return list.find((d) => d.id === id || d.name.toLowerCase() === id.toLowerCase()) || null;
  }

  async addDepartment(
    deptData: {
      name: string;
      code?: string;
      description?: string;
      headOfDepartment?: string;
      location?: string;
      budget?: number;
    },
    actorInfo?: { actorUserId?: string; actorName?: string; actorRole?: string }
  ): Promise<{ success: boolean; department?: Department; message?: string }> {
    const cleanName = deptData.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Department name cannot be empty.' };
    }

    const existingList = await this.getDepartments();
    const duplicate = existingList.find(
      (d) => d.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      return { success: false, message: `Department "${cleanName}" already exists.` };
    }

    const code =
      deptData.code?.trim().toUpperCase() ||
      cleanName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase() ||
      'DEPT';

    const id = `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDept: Department = {
      id,
      name: cleanName,
      code,
      description: deptData.description?.trim() || '',
      headOfDepartment: deptData.headOfDepartment?.trim() || '',
      location: deptData.location?.trim() || 'San Francisco HQ',
      budget: deptData.budget || 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'departments', id), newDept);
    } catch (err) {
      console.warn('Firestore addDepartment err:', err);
    }

    const updatedList = [...existingList, newDept];
    setLocalStore('departments', updatedList);

    // Log in audit trail
    await this.logAudit({
      actorUserId: actorInfo?.actorUserId || 'admin',
      actorName: actorInfo?.actorName || 'Admin Officer',
      actorRole: (actorInfo?.actorRole as any) || 'ADMIN',
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: id,
      newValue: `Created department: "${newDept.name}" [${newDept.code}]`,
    });

    return {
      success: true,
      department: newDept,
      message: `Department "${newDept.name}" created successfully.`,
    };
  }

  async updateDepartment(
    id: string,
    updates: Partial<Department>,
    actorInfo?: { actorUserId?: string; actorName?: string; actorRole?: string }
  ): Promise<{ success: boolean; department?: Department; message?: string }> {
    const list = await this.getDepartments();
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) {
      return { success: false, message: 'Department not found.' };
    }

    const prevDept = list[index];
    const prevName = prevDept.name;
    const newName = updates.name ? updates.name.trim() : prevName;

    const updatedDept: Department = {
      ...prevDept,
      ...updates,
      name: newName,
      code: updates.code ? updates.code.trim().toUpperCase() : prevDept.code,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'departments', id), updatedDept);
    } catch (err) {
      console.warn('Firestore updateDepartment err:', err);
    }

    list[index] = updatedDept;
    setLocalStore('departments', list);

    // If department name was renamed, optionally sync employees with the old department name
    if (prevName !== newName) {
      const allEmployees = await this.getEmployees();
      const affected = allEmployees.filter((e) => e.department === prevName);
      for (const emp of affected) {
        await this.saveEmployee({ ...emp, department: newName });
      }
    }

    await this.logAudit({
      actorUserId: actorInfo?.actorUserId || 'admin',
      actorName: actorInfo?.actorName || 'Admin Officer',
      actorRole: (actorInfo?.actorRole as any) || 'ADMIN',
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: id,
      previousValue: `Name: ${prevDept.name} | Code: ${prevDept.code}`,
      newValue: `Name: ${updatedDept.name} | Code: ${updatedDept.code}`,
    });

    return {
      success: true,
      department: updatedDept,
      message: `Department "${updatedDept.name}" updated successfully.`,
    };
  }

  async deleteDepartment(
    id: string,
    reassignToDeptName?: string,
    actorInfo?: { actorUserId?: string; actorName?: string; actorRole?: string }
  ): Promise<{ success: boolean; message?: string; affectedEmployeesCount?: number }> {
    const list = await this.getDepartments();
    const deptToDelete = list.find((d) => d.id === id || d.name === id);
    if (!deptToDelete) {
      return { success: false, message: 'Department not found.' };
    }

    // Check if there are employees assigned to this department
    const allEmployees = await this.getEmployees();
    const affectedEmployees = allEmployees.filter(
      (e) => e.department.toLowerCase() === deptToDelete.name.toLowerCase()
    );

    const reassignTarget = reassignToDeptName || 'General';

    // Reassign affected employees to the target department
    for (const emp of affectedEmployees) {
      await this.saveEmployee({
        ...emp,
        department: reassignTarget,
        updatedAt: new Date().toISOString(),
      });
    }

    try {
      await deleteDoc(doc(db, 'departments', deptToDelete.id));
    } catch (err) {
      console.warn('Firestore deleteDepartment err:', err);
    }

    const remaining = list.filter((d) => d.id !== deptToDelete.id);
    setLocalStore('departments', remaining);

    await this.logAudit({
      actorUserId: actorInfo?.actorUserId || 'admin',
      actorName: actorInfo?.actorName || 'Admin Officer',
      actorRole: (actorInfo?.actorRole as any) || 'ADMIN',
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: deptToDelete.id,
      previousValue: `Deleted Department "${deptToDelete.name}" (${deptToDelete.code})`,
      newValue:
        affectedEmployees.length > 0
          ? `Reassigned ${affectedEmployees.length} employee(s) to "${reassignTarget}"`
          : 'No assigned employees required reassignment.',
    });

    return {
      success: true,
      affectedEmployeesCount: affectedEmployees.length,
      message: `Department "${deptToDelete.name}" deleted successfully.${
        affectedEmployees.length > 0
          ? ` ${affectedEmployees.length} employee(s) reassigned to "${reassignTarget}".`
          : ''
      }`,
    };
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
        newValue: `Updated Monthly Wage to ₹${profile.monthlyWage.toLocaleString('en-IN')} (Yearly: ₹${profile.yearlyWage.toLocaleString('en-IN')})`,
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

  // --- EMPLOYEE REMOVAL & OFFBOARDING REQUESTS ---
  async getRemovalRequests(): Promise<EmployeeRemovalRequest[]> {
    try {
      const snap = await getDocs(collection(db, 'removalRequests'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as EmployeeRemovalRequest);
        setLocalStore('removalRequests', list);
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.warn('Firestore getRemovalRequests err:', err);
    }
    return getLocalStore<EmployeeRemovalRequest[]>('removalRequests', DEMO_REMOVAL_REQUESTS).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async saveRemovalRequest(req: EmployeeRemovalRequest): Promise<void> {
    try {
      await setDoc(doc(db, 'removalRequests', req.id), req);
    } catch (err) {
      console.warn('Firestore saveRemovalRequest err:', err);
    }
    const all = getLocalStore<EmployeeRemovalRequest[]>('removalRequests', DEMO_REMOVAL_REQUESTS);
    const idx = all.findIndex((r) => r.id === req.id);
    if (idx >= 0) all[idx] = req;
    else all.unshift(req);
    setLocalStore('removalRequests', all);
  }

  async deleteRemovalRequest(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'removalRequests', id));
    } catch (err) {
      console.warn('Firestore deleteRemovalRequest err:', err);
    }
    let all = getLocalStore<EmployeeRemovalRequest[]>('removalRequests', DEMO_REMOVAL_REQUESTS);
    all = all.filter((r) => r.id !== id);
    setLocalStore('removalRequests', all);
  }

  // Terminate employee (soft delete / status update to TERMINATED)
  async terminateEmployee(
    employeeId: string,
    reason?: string,
    actor?: { id: string; name: string; role: any }
  ): Promise<void> {
    const emp = await this.getEmployeeById(employeeId);
    if (emp) {
      const updated: Employee = {
        ...emp,
        employmentStatus: 'TERMINATED',
        updatedAt: new Date().toISOString(),
      };
      await this.saveEmployee(updated, actor);

      // Deactivate associated user account
      const users = getLocalStore<User[]>('users', DEMO_USERS);
      const userIdx = users.findIndex(
        (u) => u.employeeId === employeeId || (emp.uid && u.uid === emp.uid) || u.email === emp.email
      );
      if (userIdx >= 0) {
        users[userIdx] = { ...users[userIdx], status: 'INACTIVE', updatedAt: new Date().toISOString() };
        try {
          await setDoc(doc(db, 'users', users[userIdx].uid), users[userIdx]);
        } catch (e) {
          console.warn('User status update error:', e);
        }
        setLocalStore('users', users);
      }

      if (actor) {
        await this.logAudit({
          actorUserId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action: 'EMPLOYEE_TERMINATED',
          entityType: 'Employee',
          entityId: employeeId,
          newValue: `Terminated ${emp.fullName}. Reason: ${reason || 'Admin termination'}`,
        });
      }
    }
  }

  // Hard delete employee (if completely purged)
  async deleteEmployee(employeeId: string, actor?: { id: string; name: string; role: any }): Promise<void> {
    const emp = await this.getEmployeeById(employeeId);
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (err) {
      console.warn('Firestore deleteEmployee err:', err);
    }
    let all = getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES);
    all = all.filter((e) => e.employeeId !== employeeId && e.id !== employeeId);
    setLocalStore('employees', all);

    if (actor && emp) {
      await this.logAudit({
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'EMPLOYEE_DELETED',
        entityType: 'Employee',
        entityId: employeeId,
        previousValue: `${emp.fullName} (${emp.department})`,
      });
    }
  }

  // Admin freely assigns / transfers employee and HR roles
  async assignUserRole(
    employeeId: string,
    newRole: UserRole,
    department?: string,
    designation?: string,
    actor?: { id: string; name: string; role: any }
  ): Promise<{ success: boolean; message: string }> {
    const emp = await this.getEmployeeById(employeeId);
    if (!emp) {
      return { success: false, message: 'Employee record not found.' };
    }

    const previousRole = emp.department.includes('Human') ? 'HR' : 'EMPLOYEE';

    // Update Employee record
    const updatedEmp: Employee = {
      ...emp,
      department: department || emp.department,
      designation: designation || emp.designation,
      updatedAt: new Date().toISOString(),
    };
    await this.saveEmployee(updatedEmp);

    // Update User account
    const users = getLocalStore<User[]>('users', DEMO_USERS);
    const userIdx = users.findIndex(
      (u) => u.employeeId === employeeId || (emp.uid && u.uid === emp.uid) || u.email.toLowerCase() === emp.email.toLowerCase()
    );

    let targetUid = emp.uid || `user-${employeeId}`;

    if (userIdx >= 0) {
      users[userIdx] = {
        ...users[userIdx],
        role: newRole,
        updatedAt: new Date().toISOString(),
      };
      targetUid = users[userIdx].uid;
      try {
        await setDoc(doc(db, 'users', users[userIdx].uid), users[userIdx]);
      } catch (e) {
        console.warn('User update error:', e);
      }
      setLocalStore('users', users);
    } else {
      // Create new user profile mapping for this employee
      const newUser: User = {
        uid: targetUid,
        employeeId: emp.employeeId,
        email: emp.email,
        role: newRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
      };
      users.push(newUser);
      try {
        await setDoc(doc(db, 'users', newUser.uid), newUser);
      } catch (e) {
        console.warn('New user creation error:', e);
      }
      setLocalStore('users', users);
    }

    // Dispatch notification to the employee
    await this.addNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipientUserId: targetUid,
      type: 'ROLE_ASSIGNED',
      title: 'Role & Access Updated',
      message: `Your system access level has been configured as ${newRole} by Administrator ${actor?.name || ''}.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedEntityId: employeeId,
      relatedEntityType: 'EMPLOYEE',
    });

    if (actor) {
      await this.logAudit({
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'ROLE_ASSIGNED',
        entityType: 'UserRole',
        entityId: employeeId,
        previousValue: `Role: ${previousRole}`,
        newValue: `Assigned Role: ${newRole} | Dept: ${updatedEmp.department} | Title: ${updatedEmp.designation}`,
      });
    }

    return {
      success: true,
      message: `Successfully assigned ${emp.fullName} to ${newRole} (${updatedEmp.department})`,
    };
  }

  // --- CREDENTIALS & LOGIN ID MANAGEMENT ---
  generateStandardLoginId(
    companyName: string = 'Dayflow Technologies',
    firstName: string = 'User',
    lastName: string = 'Member',
    yearOfJoining: number = new Date().getFullYear(),
    seqNumber?: number
  ): string {
    const cleanCompany = (companyName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'DF').toUpperCase();
    const cleanFirst = (firstName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'EM').toUpperCase();
    const cleanLast = (lastName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'PL').toUpperCase();
    const year = yearOfJoining || new Date().getFullYear();
    
    // Find current max seq
    if (seqNumber === undefined) {
      const all = getLocalStore<Employee[]>('employees', DEMO_EMPLOYEES);
      seqNumber = all.length + 1;
    }
    const seqStr = String(seqNumber).padStart(4, '0');
    return `${cleanCompany}${cleanFirst}${cleanLast}${year}${seqStr}`;
  }

  async getEmployeeByLoginId(loginId: string): Promise<Employee | null> {
    const all = await this.getEmployees();
    const normalized = loginId.trim().toLowerCase();
    return (
      all.find(
        (e) =>
          (e.loginId && e.loginId.trim().toLowerCase() === normalized) ||
          e.employeeId.toLowerCase() === normalized
      ) || null
    );
  }

  async getEmployeeByEmailOrLoginId(identifier: string): Promise<Employee | null> {
    const all = await this.getEmployees();
    const normalized = identifier.trim().toLowerCase();
    return (
      all.find(
        (e) =>
          e.email.trim().toLowerCase() === normalized ||
          (e.loginId && e.loginId.trim().toLowerCase() === normalized) ||
          e.employeeId.toLowerCase() === normalized
      ) || null
    );
  }

  // Admin resets or edits password, login ID, and role for any employee
  async updateUserCredentials(
    employeeId: string,
    updates: {
      loginId?: string;
      password?: string;
      role?: UserRole;
      department?: string;
      designation?: string;
    },
    actor?: { id: string; name: string; role: any }
  ): Promise<{ success: boolean; message: string }> {
    const emp = await this.getEmployeeById(employeeId);
    if (!emp) {
      return { success: false, message: 'Employee record not found.' };
    }

    const prevLoginId = emp.loginId || emp.employeeId;

    // Check if new login ID is already taken by another employee
    if (updates.loginId && updates.loginId.trim().toLowerCase() !== (emp.loginId || '').toLowerCase()) {
      const existing = await this.getEmployeeByLoginId(updates.loginId.trim());
      if (existing && existing.employeeId !== employeeId) {
        return { success: false, message: `Login ID "${updates.loginId}" is already assigned to another user.` };
      }
    }

    const updatedEmp: Employee = {
      ...emp,
      loginId: updates.loginId !== undefined ? updates.loginId.trim() : emp.loginId,
      password: updates.password !== undefined ? updates.password.trim() : emp.password,
      department: updates.department || emp.department,
      designation: updates.designation || emp.designation,
      updatedAt: new Date().toISOString(),
    };

    await this.saveEmployee(updatedEmp);

    // Sync with User table
    if (updates.role || updates.loginId) {
      const users = getLocalStore<User[]>('users', DEMO_USERS);
      const userIdx = users.findIndex(
        (u) => u.employeeId === employeeId || (emp.uid && u.uid === emp.uid) || u.email.toLowerCase() === emp.email.toLowerCase()
      );

      if (userIdx >= 0) {
        users[userIdx] = {
          ...users[userIdx],
          loginId: updates.loginId !== undefined ? updates.loginId.trim() : users[userIdx].loginId,
          role: updates.role || users[userIdx].role,
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, 'users', users[userIdx].uid), users[userIdx]);
        } catch (e) {
          console.warn('Firestore user update err:', e);
        }
        setLocalStore('users', users);
      }
    }

    // Log the change
    if (actor) {
      const changes: string[] = [];
      if (updates.loginId && updates.loginId !== prevLoginId) changes.push(`Login ID -> "${updates.loginId}"`);
      if (updates.password) changes.push('Password updated/reset');
      if (updates.role) changes.push(`Role -> ${updates.role}`);

      await this.logAudit({
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'SECURITY_CREDENTIALS_UPDATED',
        entityType: 'UserCredentials',
        entityId: employeeId,
        newValue: `Updated credentials for ${emp.fullName}: ${changes.join(', ')}`,
      });
    }

    // Notify employee of security update
    if (emp.uid) {
      await this.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        recipientUserId: emp.uid,
        type: 'SECURITY_ALERT',
        title: 'Account Credentials Updated',
        message: `Your account credentials (Login ID / Password / Role) were updated by Administrator ${actor?.name || ''}.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityId: employeeId,
        relatedEntityType: 'EMPLOYEE',
      });
    }

    return {
      success: true,
      message: `Successfully updated credentials for ${emp.fullName}.`,
    };
  }
}

export const dayflowDb = new DayflowDbService();
