import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = 'INR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  try {
    // If currency is INR or USD (legacy fallback), format in INR
    const targetCurrency = currency === 'USD' ? 'INR' : currency || 'INR';
    const locale = targetCurrency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const num = Number(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDate(dateString: string | null | undefined, formatStr = 'MMM dd, yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(isoOrTimeString: string | null | undefined): string {
  if (!isoOrTimeString) return '—';
  try {
    if (isoOrTimeString.includes('T')) {
      const d = new Date(isoOrTimeString);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    // If it's already HH:MM or HH:MM:SS
    const parts = isoOrTimeString.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return isoOrTimeString;
  } catch {
    return isoOrTimeString;
  }
}

export function calculateWorkingDays(startDateStr: string, endDateStr: string, workingDaysPerWeek = 5): number {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return 0;
    }
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (workingDaysPerWeek === 5) {
        if (day !== 0 && day !== 6) count++;
      } else if (workingDaysPerWeek === 6) {
        if (day !== 0) count++;
      } else {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  } catch {
    return 1;
  }
}

export function generateEmployeeId(
  firstName: string,
  lastName: string,
  yearOfJoining: number,
  sequenceNumber: number,
  prefix = 'DAYFLOW',
  pattern: 'PREFIX_NAME_YEAR_SEQ' | 'PREFIX_YEAR_SEQ' | 'PREFIX_SEQ' | 'NUMERIC_SEQ' = 'PREFIX_NAME_YEAR_SEQ'
): string {
  const seqStr = String(sequenceNumber).padStart(3, '0');
  const nameInitials = `${(firstName[0] || 'E').toUpperCase()}${(lastName[0] || 'M').toUpperCase()}`;
  
  if (pattern === 'PREFIX_NAME_YEAR_SEQ') {
    return `${prefix}-${nameInitials}${yearOfJoining}-${seqStr}`;
  } else if (pattern === 'PREFIX_YEAR_SEQ') {
    return `${prefix}-${yearOfJoining}-${seqStr}`;
  } else if (pattern === 'PREFIX_SEQ') {
    return `${prefix}-${seqStr}`;
  } else {
    return `${prefix}${seqStr}`;
  }
}

export function generateTemporaryPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let result = 'DayFlow!';
  for (let i = 0; i < length - 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function decimalRound(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
