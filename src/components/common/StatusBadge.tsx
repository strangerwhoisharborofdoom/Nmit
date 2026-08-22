import React from 'react';
import { cn } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  switch (normalized) {
    case 'PRESENT':
    case 'APPROVED':
    case 'ACTIVE':
    case 'FINALIZED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
            sizeClasses,
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
        </span>
      );

    case 'PENDING':
    case 'HALF_DAY':
    case 'PROBATION':
    case 'DRAFT':
    case 'CALCULATED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
            sizeClasses,
            className
          )}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
        </span>
      );

    case 'REJECTED':
    case 'ABSENT':
    case 'TERMINATED':
    case 'CANCELLED':
    case 'INACTIVE':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-medium',
            sizeClasses,
            className
          )}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
        </span>
      );

    case 'LEAVE':
    case 'ON_LEAVE':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-medium',
            sizeClasses,
            className
          )}
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>On Leave</span>
        </span>
      );

    case 'INCOMPLETE':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 font-medium',
            sizeClasses,
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>Incomplete</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium',
            sizeClasses,
            className
          )}
        >
          <span>{status}</span>
        </span>
      );
  }
};
