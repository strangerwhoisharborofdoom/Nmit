import { Attendance, AttendanceStatus } from '../types';
import { decimalRound } from '../lib/utils';

export interface AttendanceCalculationResult {
  workHours: number;
  extraHours: number;
  status: AttendanceStatus;
  remarks?: string;
}

export function calculateAttendanceHours(
  checkInIsoOrTime: string | null | undefined,
  checkOutIsoOrTime: string | null | undefined,
  breakMinutes = 0,
  dailyStandardHours = 8.0
): AttendanceCalculationResult {
  if (!checkInIsoOrTime) {
    return {
      workHours: 0,
      extraHours: 0,
      status: 'ABSENT',
      remarks: 'No check-in recorded',
    };
  }

  if (!checkOutIsoOrTime) {
    return {
      workHours: 0,
      extraHours: 0,
      status: 'INCOMPLETE',
      remarks: 'Active session / missing check-out',
    };
  }

  try {
    let checkInDate: Date;
    let checkOutDate: Date;

    if (checkInIsoOrTime.includes('T')) {
      checkInDate = new Date(checkInIsoOrTime);
    } else {
      const [h, m] = checkInIsoOrTime.split(':').map(Number);
      checkInDate = new Date();
      checkInDate.setHours(h || 0, m || 0, 0, 0);
    }

    if (checkOutIsoOrTime.includes('T')) {
      checkOutDate = new Date(checkOutIsoOrTime);
    } else {
      const [h, m] = checkOutIsoOrTime.split(':').map(Number);
      checkOutDate = new Date();
      checkOutDate.setHours(h || 0, m || 0, 0, 0);
    }

    let diffMs = checkOutDate.getTime() - checkInDate.getTime();
    if (diffMs < 0) {
      // Handles overnight shifts where check-out is next day
      diffMs += 24 * 60 * 60 * 1000;
    }

    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)) - (breakMinutes || 0));
    const rawWorkHours = totalMinutes / 60;
    const workHours = decimalRound(rawWorkHours, 2);

    const extraHours = workHours > dailyStandardHours 
      ? decimalRound(workHours - dailyStandardHours, 2)
      : 0;

    let status: AttendanceStatus = 'PRESENT';
    if (workHours < 4) {
      status = 'HALF_DAY';
    } else if (workHours >= 4) {
      status = 'PRESENT';
    }

    return {
      workHours,
      extraHours,
      status,
    };
  } catch (err) {
    console.error('Error calculating attendance hours:', err);
    return {
      workHours: 0,
      extraHours: 0,
      status: 'INCOMPLETE',
      remarks: 'Calculation parsing error',
    };
  }
}
