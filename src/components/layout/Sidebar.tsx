'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Wrench,
  Receipt,
  Package,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: '' },
  { href: '/dashboard/customers', label: 'Customers', icon: Users, badge: '' },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: Car, badge: '' },
  { href: '/dashboard/job-cards', label: 'Jobs', icon: ClipboardList, badge: '3' },
  { href: '/dashboard/billing', label: 'Billing', icon: Receipt, badge: '' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package, badge: '' },
  { href: '/dashboard/services', label: 'Services', icon: Wrench, badge: '' },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star, badge: '' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col overflow-visible"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      <div className="absolute inset-0 border-r border-[var(--border-color)]" />

      {/* Decorative glow */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-red-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Collapse toggle — sits on the right border edge */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="absolute top-5 -right-3.5 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-tertiary)] hover:bg-red-600 hover:border-red-600 hover:text-white shadow-md transition-all duration-200 cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </motion.button>

      {/* Logo Section */}
      <div className="relative z-10 border-b border-[var(--border-color)]">
        <Link href="/dashboard" className={cn('flex items-center overflow-hidden transition-all duration-300', collapsed ? 'justify-center px-2 py-3' : 'justify-start px-4 py-4')}>
          {collapsed ? (
            <div className="relative w-10 h-10 transition-all duration-300">
              <Image
                src="/favicon.png"
                alt="Car Affair"
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="relative flex-shrink-0 w-full h-14 transition-all duration-300">
              <Image
                src="/logo.png"
                alt="Car Affair"
                fill
                className="object-contain object-left logo-adaptive"
                priority
              />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className={cn("relative z-10 flex-1 flex flex-col px-3 pt-5 pb-3", collapsed ? 'overflow-visible' : 'overflow-y-auto')} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-200 group relative',
                    collapsed ? 'justify-center p-2.5 rounded-2xl' : 'px-3 py-2.5 rounded-xl overflow-hidden',
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-100" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className={cn(
                      'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                      isActive ? 'bg-white/15' : 'bg-[var(--bg-tertiary)] group-hover:bg-red-500/10'
                    )}>
                      <item.icon className={cn('h-[18px] w-[18px] transition-colors duration-200', isActive ? 'text-white' : 'group-hover:text-red-500')} />
                    </div>

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex items-center justify-between flex-1 min-w-0">
                          <span className={cn('text-sm font-medium whitespace-nowrap', isActive && 'font-semibold')}>{item.label}</span>
                          {item.badge && (
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', isActive ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-500')}>{item.badge}</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tooltip on collapsed hover */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 whitespace-nowrap z-50">
                      <span className="text-xs font-medium text-[var(--text-primary)]">{item.label}</span>
                      {item.badge && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">{item.badge}</span>
                      )}
                      <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 bg-[var(--bg-secondary)] border-l border-b border-[var(--border-color)]" />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
