import {
  SalaryProfile,
  SalaryComponent,
  ComponentBreakdownItem,
  Payslip,
  Employee,
} from '../types';
import { decimalRound } from '../lib/utils';

export interface CalculatePayrollParams {
  employee: Employee;
  salaryProfile: SalaryProfile;
  salaryComponents: SalaryComponent[];
  monthContext: {
    month: string;
    workingDays: number;
    presentDays: number;
    leaveDays: number;
    unpaidDays: number;
  };
}

export function calculateEmployeePayroll(
  employee: Employee,
  salaryProfile: SalaryProfile,
  salaryComponents: SalaryComponent[],
  monthContext: {
    month: string;
    workingDays: number;
    presentDays: number;
    leaveDays: number;
    unpaidDays: number;
  }
) {
  const { workingDays, unpaidDays, month } = monthContext;
  const nonPayableDays = Math.max(0, unpaidDays);
  const payableDays = Math.max(0, workingDays - nonPayableDays);
  const prorationRatio = workingDays > 0 ? payableDays / workingDays : 1;

  const monthlyBaseWage = salaryProfile.monthlyWage || 0;

  // Basic salary component or 50% fallback
  let basicSalaryAmount = 0;
  const basicComponent = salaryComponents.find(
    (c) => c.code === 'BASIC' || c.name.toLowerCase().includes('basic')
  );

  if (basicComponent) {
    if (basicComponent.calculationMethod === 'PERCENTAGE') {
      basicSalaryAmount = decimalRound((monthlyBaseWage * basicComponent.value) / 100);
    } else {
      basicSalaryAmount = basicComponent.value;
    }
  } else {
    basicSalaryAmount = decimalRound(monthlyBaseWage * 0.5);
  }

  const earnings: ComponentBreakdownItem[] = [];
  const deductions: ComponentBreakdownItem[] = [];
  let totalEarnings = 0;
  let totalDeductions = 0;

  for (const comp of salaryComponents) {
    let unproratedAmount = 0;
    if (comp.calculationMethod === 'PERCENTAGE') {
      const baseValue = comp.percentageBase === 'BASIC_SALARY' ? basicSalaryAmount : monthlyBaseWage;
      unproratedAmount = decimalRound((baseValue * comp.value) / 100);
    } else {
      unproratedAmount = comp.value;
    }

    if (comp.isEarning) {
      const finalAmount = decimalRound(unproratedAmount * prorationRatio);
      totalEarnings += finalAmount;
      earnings.push({
        name: comp.name,
        code: comp.code,
        amount: finalAmount,
        type: 'EARNING',
      });
    } else if (comp.isDeduction) {
      const finalAmount = decimalRound(
        unproratedAmount * (comp.percentageBase === 'BASIC_SALARY' ? prorationRatio : 1)
      );
      totalDeductions += finalAmount;
      deductions.push({
        name: comp.name,
        code: comp.code,
        amount: finalAmount,
        type: 'DEDUCTION',
      });
    }
  }

  if (earnings.length === 0 && monthlyBaseWage > 0) {
    const defaultEarning = decimalRound(monthlyBaseWage * prorationRatio);
    totalEarnings = defaultEarning;
    earnings.push({
      name: 'Base Monthly Wage',
      code: 'BASE_WAGE',
      amount: defaultEarning,
      type: 'EARNING',
    });
  }

  const grossSalary = totalEarnings;
  const netSalary = Math.max(0, decimalRound(grossSalary - totalDeductions));

  return {
    basicSalary: basicSalaryAmount,
    grossSalary,
    totalDeductions,
    netSalary,
    payableDays,
    workingDays,
    unpaidDays,
    earnings,
    deductions,
  };
}
