'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Calendar, Car, User, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSignOut } from '@/hooks/useSignOut';

const navItems = [
  { href: '/me', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/me/bookings', label: 'My Bookings', icon: Calendar },
  { href: '/me/vehicles', label: 'My Vehicles', icon: Car },
  { href: '/me/profile', label: 'Profile', icon: User },
];

export default function PortalShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-[var(--border-glass)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/me" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Car Affair" width={512} height={100} className="h-8 w-auto logo-adaptive" priority />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-red-500/15 text-red-500'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-[var(--text-secondary)]">{userName}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[var(--border-color)] overflow-hidden"
            >
              <nav className="flex flex-col p-4 gap-1">
                {navItems.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                        active ? 'bg-red-500/15 text-red-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">{children}</main>
    </div>
  );
}
