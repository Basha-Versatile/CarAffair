'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  delay?: number;
}

export default function StatCard({ title, value, icon, trend, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('glass rounded-2xl p-6 glass-hover transition-all duration-300', className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-tertiary)]">{title}</p>
          <p className="text-3xl font-bold gradient-text">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trend.isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-500">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
