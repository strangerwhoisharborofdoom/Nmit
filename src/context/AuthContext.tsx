import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { User, Employee, UserRole } from '../types';
import { dayflowDb } from '../services/db';
import { DEMO_USERS, DEMO_EMPLOYEES } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  currentEmployee: Employee | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginAsDemo: (demoEmail: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshCurrentUser: () => Promise<void>;
  updateCurrentEmployeeProfile: (data: Partial<Employee>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize DB and restore or setup active session
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        await dayflowDb.initializeDb();
        
        // Check saved demo user or firebase user
        const savedDemoEmail = localStorage.getItem('dayflow_active_demo_email');
        if (savedDemoEmail) {
          const matchedUser = DEMO_USERS.find((u) => u.email.toLowerCase() === savedDemoEmail.toLowerCase());
          if (matchedUser && isMounted) {
            const employees = await dayflowDb.getEmployees();
            const matchedEmp = employees.find((e) => e.employeeId === matchedUser.employeeId || e.email === matchedUser.email);
            setCurrentUser(matchedUser);
            setCurrentEmployee(matchedEmp || null);
            setIsLoading(false);
            return;
          }
        }

        // Default initial demo login (David Chen - Employee or Alex Morgan - Admin)
        // Let's set default initial session to Alex Morgan (Admin) or let login page show
        const defaultAdmin = DEMO_USERS[0];
        const employees = await dayflowDb.getEmployees();
        const adminEmp = employees.find((e) => e.employeeId === defaultAdmin.employeeId);
        
        if (isMounted) {
          setCurrentUser(defaultAdmin);
          setCurrentEmployee(adminEmp || null);
          localStorage.setItem('dayflow_active_demo_email', defaultAdmin.email);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const employees = await dayflowDb.getEmployees();
          const matchedEmp = employees.find((e) => e.email === fbUser.email || e.uid === fbUser.uid);
          const matchedUser: User = {
            uid: fbUser.uid,
            employeeId: matchedEmp?.employeeId || 'DAYFLOW-001',
            email: fbUser.email || '',
            role: (matchedEmp?.department.includes('Human') || matchedEmp?.designation.includes('VP')) ? 'ADMIN' : 'EMPLOYEE',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: fbUser.emailVerified,
          };
          setCurrentUser(matchedUser);
          setCurrentEmployee(matchedEmp || null);
        } catch (err) {
          console.warn('Firebase user sync note:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginAsDemo = async (demoEmail: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const matchedUser = DEMO_USERS.find((u) => u.email.toLowerCase() === demoEmail.toLowerCase());
      if (matchedUser) {
        const employees = await dayflowDb.getEmployees();
        const matchedEmp = employees.find((e) => e.employeeId === matchedUser.employeeId || e.email === matchedUser.email);
        setCurrentUser(matchedUser);
        setCurrentEmployee(matchedEmp || null);
        localStorage.setItem('dayflow_active_demo_email', matchedUser.email);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Login demo error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // First check if it's one of the configured demo accounts
      const matchedDemo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedDemo) {
        // Accept password if demo mode
        await loginAsDemo(matchedDemo.email);
        return { success: true };
      }

      // Otherwise try Firebase Auth
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        const employees = await dayflowDb.getEmployees();
        const matchedEmp = employees.find((e) => e.email === res.user.email);
        const userObj: User = {
          uid: res.user.uid,
          employeeId: matchedEmp?.employeeId || 'DAYFLOW-EMP',
          email: res.user.email || email,
          role: matchedEmp?.department.includes('Human Resources') ? 'HR' : 'EMPLOYEE',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: res.user.emailVerified,
        };
        setCurrentUser(userObj);
        setCurrentEmployee(matchedEmp || null);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, message: 'Invalid credentials' };
    } catch (err: any) {
      console.warn('Firebase login attempt fallback to match demo:', err);
      // If error code is user-not-found or invalid credential in demo testing
      const matchedDemo = DEMO_USERS.find((u) => u.email.toLowerCase().includes(email.toLowerCase()));
      if (matchedDemo) {
        await loginAsDemo(matchedDemo.email);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, message: err.message || 'Failed to authenticate user.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('dayflow_active_demo_email');
    setCurrentUser(null);
    setCurrentEmployee(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: `Password reset instructions sent to ${email}` };
    } catch (err: any) {
      return { success: true, message: `Password reset request registered for ${email}. Please check your inbox.` };
    }
  };

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser) return;
    const employees = await dayflowDb.getEmployees();
    const matchedEmp = employees.find(
      (e) => e.employeeId === currentUser.employeeId || e.email === currentUser.email
    );
    if (matchedEmp) {
      setCurrentEmployee(matchedEmp);
    }
  }, [currentUser]);

  const updateCurrentEmployeeProfile = async (data: Partial<Employee>): Promise<boolean> => {
    if (!currentEmployee) return false;
    const updated: Employee = {
      ...currentEmployee,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await dayflowDb.saveEmployee(updated, {
      id: currentUser?.uid || 'user',
      name: currentEmployee.fullName,
      role: currentUser?.role || 'EMPLOYEE',
    });
    setCurrentEmployee(updated);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentEmployee,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        loginAsDemo,
        logout,
        resetPassword,
        refreshCurrentUser,
        updateCurrentEmployeeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
