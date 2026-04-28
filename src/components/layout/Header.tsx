'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Bell, Search, User, Settings, LogOut, ChevronDown,
  CheckCircle, XCircle, CreditCard, Star, MessageSquare, Clock, CalendarDays,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { markAdminAlertRead, markAllAlertsRead } from '@/features/notifications/notificationSlice';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/format';
import { useSignOut } from '@/hooks/useSignOut';
import Link from 'next/link';
import type { AlertType } from '@/types';

const alertConfig: Record<AlertType, { icon: typeof CheckCircle; color: string; bg: string }> = {
  quote_accepted: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  quote_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  payment_received: { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  review_submitted: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  job_created: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  status_updated: { icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  booking_created: { icon: CalendarDays, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const alerts = useAppSelector((state) => state.notifications.alerts ?? []);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const signOut = useSignOut();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-[var(--border-glass)]">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl glass hover:bg-[var(--bg-glass-hover)] transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[var(--text-secondary)]" />}
            </motion.button>
          )}

          {/* Notification Bell */}
          <div ref={bellRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2.5 rounded-xl glass hover:bg-[var(--bg-glass-hover)] transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-[var(--bg-secondary)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-96 glass-strong rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold">{unreadCount} new</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          dispatch(markAllAlertsRead());
                          alerts.filter((a) => !a.read).forEach((a) => dispatch(markAdminAlertRead(a.id)));
                        }}
                        className="text-[11px] text-red-500 hover:text-red-400 font-medium cursor-pointer transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Alerts list */}
                  <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {alerts.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell className="w-8 h-8 text-[var(--text-tertiary)]/30 mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-tertiary)]">No notifications yet</p>
                      </div>
                    ) : (
                      alerts.slice(0, 20).map((alert, idx) => {
                        const config = alertConfig[alert.type];
                        const AlertIcon = config.icon;
                        return (
                          <motion.div
                            key={alert.id}
                            initial={idx < 3 ? { opacity: 0, x: -10 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => { if (!alert.read) dispatch(markAdminAlertRead(alert.id)); }}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer ${!alert.read ? 'bg-[var(--bg-tertiary)]/50' : ''}`}
                          >
                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center mt-0.5`}>
                              <AlertIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium ${!alert.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                  {alert.title}
                                </p>
                                {!alert.read && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{alert.message}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]/60 mt-1">{formatDateTime(alert.createdAt)}</p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {alerts.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-[var(--border-color)] text-center">
                      <p className="text-[11px] text-[var(--text-tertiary)]">{alerts.length} total notification{alerts.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-[var(--border-color)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email || 'admin@caraffair.com'}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 glass-strong rounded-xl border border-[var(--border-color)] shadow-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email || 'admin@caraffair.com'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await signOut();
                        toast.info('Signed Out', 'You have been logged out');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
