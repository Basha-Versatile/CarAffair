'use client';

import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  IndianRupee,
  Users,
  TrendingUp,
  ArrowUpRight,
  Wrench,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency, formatDate } from '@/utils/format';
import type { JobCardStatus } from '@/types';

const statusBadge: Record<JobCardStatus, { variant: 'warning' | 'info' | 'purple' | 'success'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'purple', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
};

export default function DashboardPage() {
  const { jobCards } = useAppSelector((state) => state.jobCards);
  const { customers } = useAppSelector((state) => state.customers);
  const { bills } = useAppSelector((state) => state.billing);

  const totalRevenue = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.total, 0);
  const pendingJobs = jobCards.filter((j) => j.status === 'pending').length;
  const inProgressJobs = jobCards.filter((j) => j.status === 'in_progress').length;
  const completedJobs = jobCards.filter((j) => j.status === 'completed').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Welcome back. Here&apos;s your garage overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={jobCards.length}
          icon={<ClipboardList className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="Pending Jobs"
          value={pendingJobs}
          icon={<Clock className="h-6 w-6" />}
          delay={0.1}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<IndianRupee className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          delay={0.2}
        />
        <StatCard
          title="Customers"
          value={customers.length}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Jobs</h2>
              <a href="/dashboard/job-cards" className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="space-y-3">
              {jobCards.slice(0, 5).map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-glass-hover)] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{job.vehicleName}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{job.customerName} &middot; {job.licensePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadge[job.status].variant}>{statusBadge[job.status].label}</Badge>
                    <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">{formatDate(job.createdAt)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Job Status</h2>
            <div className="space-y-4">
              {[
                { label: 'Completed', value: completedJobs, total: jobCards.length, color: 'bg-emerald-500' },
                { label: 'In Progress', value: inProgressJobs, total: jobCards.length, color: 'bg-red-500' },
                { label: 'Pending', value: pendingJobs, total: jobCards.length, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-[var(--text-primary)] font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Stats</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Avg. Job Value</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(totalRevenue / (completedJobs || 1))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Completion Rate</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {jobCards.length ? Math.round((completedJobs / jobCards.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Total Vehicles</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {customers.reduce((sum, c) => sum + c.vehicles.length, 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
