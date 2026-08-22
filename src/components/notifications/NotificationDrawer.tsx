import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Clock, Calendar, DollarSign, UserCheck, X } from 'lucide-react';
import { Notification } from '../../types';
import { dayflowDb } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const data = await dayflowDb.getNotifications(currentUser.uid);
    setNotifications(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen, currentUser]);

  const handleMarkAsRead = async (id: string) => {
    await dayflowDb.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.read) await dayflowDb.markNotificationRead(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              <p className="text-xs text-slate-500">
                {notifications.filter((n) => !n.read).length} unread updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-1.5 rounded-md hover:bg-indigo-50 transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              Loading updates...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Bell className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                When leave updates, payroll runs, or reminders occur, they will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={cn(
                  'p-3.5 rounded-xl border transition-all cursor-pointer relative',
                  notif.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-indigo-50/40 border-indigo-100 text-slate-900 shadow-xs'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      notif.type.includes('LEAVE') && 'bg-sky-100 text-sky-600',
                      notif.type.includes('SALARY') && 'bg-emerald-100 text-emerald-600',
                      notif.type.includes('ATTENDANCE') && 'bg-amber-100 text-amber-600',
                      notif.type.includes('PROFILE') && 'bg-purple-100 text-purple-600',
                      notif.type === 'SYSTEM' && 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {notif.type.includes('LEAVE') && <Calendar className="w-4 h-4" />}
                    {notif.type.includes('SALARY') && <DollarSign className="w-4 h-4" />}
                    {notif.type.includes('ATTENDANCE') && <Clock className="w-4 h-4" />}
                    {notif.type.includes('PROFILE') && <UserCheck className="w-4 h-4" />}
                    {notif.type === 'SYSTEM' && <Bell className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate">{notif.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
