'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Car, Wrench, ArrowRight, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { format12h } from '@/utils/time';
import { formatDate } from '@/utils/format';
import type { Booking, JobCard, Vehicle } from '@/types';

interface Profile { id: string; name: string; email: string; phone: string; address: string }

const statusLabel: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved', tone: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', tone: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  completed: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

function formatBookingDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CustomerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<{ profile: Profile }>('/api/me/profile').catch(() => null),
      api.get<{ bookings: Booking[] }>('/api/me/bookings').catch(() => null),
      api.get<{ vehicles: Vehicle[] }>('/api/me/vehicles').catch(() => null),
      api.get<{ jobCards: JobCard[] }>('/api/me/jobs').catch(() => null),
    ]).then(([p, b, v, j]) => {
      if (cancelled) return;
      if (p) setProfile(p.profile);
      if (b) setBookings(b.bookings ?? []);
      if (v) setVehicles(v.vehicles ?? []);
      if (j) setJobs(j.jobCards ?? []);
    });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' && b.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [bookings, today]
  );
  const openJobs = useMemo(() => jobs.filter((j) => j.status !== 'completed'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === 'completed'), [jobs]);
  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Hi {profile?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Here&apos;s what&apos;s happening with your cars.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Wrench className="h-5 w-5 text-red-500" />} label="Open jobs" value={openJobs.length} hint="In service or pending" />
        <StatCard icon={<Calendar className="h-5 w-5 text-red-500" />} label="Upcoming bookings" value={upcomingBookings.length} hint="Scheduled visits" />
        <StatCard icon={<Car className="h-5 w-5 text-red-500" />} label="Vehicles on file" value={vehicles.length} hint="Cars we know about" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming bookings</h2>
            <Link href="/me/bookings" className="text-xs text-red-500 hover:text-red-400 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-tertiary)]">No upcoming bookings.</p>
              <Link href="/book" className="inline-block mt-3 text-sm text-red-500 hover:text-red-400 font-medium">
                Book a service →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{b.vehicleSummary || b.registrationNumber}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {formatBookingDate(b.date)} · {format12h(b.startTime)} – {format12h(b.endTime)}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent service activity</h2>
            <Link href="/me/bookings" className="text-xs text-red-500 hover:text-red-400 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-tertiary)]">Nothing yet — your service history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((j) => {
                const sl = statusLabel[j.status] ?? statusLabel.pending;
                return (
                  <Link
                    key={j.id}
                    href={`/me/jobs/${j.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-glass-hover)] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{j.vehicleName}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{j.licensePlate} · {j.createdAt ? formatDate(j.createdAt) : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${sl.tone}`}>{sl.label}</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {completedJobs.length > 0 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-3 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {completedJobs.length} completed service{completedJobs.length !== 1 ? 's' : ''} on record
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">{icon}</div>
        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{hint}</p>
    </div>
  );
}
