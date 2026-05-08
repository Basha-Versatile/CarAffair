'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Wrench } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { format12h } from '@/utils/time';
import { formatDate } from '@/utils/format';
import type { Booking, JobCard } from '@/types';

const jobStatusTone: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};
const jobStatusLabel: Record<string, string> = {
  pending: 'Pending', approved: 'Approved', in_progress: 'In Progress', completed: 'Completed',
};

type Tab = 'upcoming' | 'in-progress' | 'completed' | 'all';

function bookingDateLabel(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<{ bookings: Booking[] }>('/api/me/bookings').catch(() => null),
      api.get<{ jobCards: JobCard[] }>('/api/me/jobs').catch(() => null),
    ]).then(([b, j]) => {
      if (cancelled) return;
      if (b) setBookings(b.bookings ?? []);
      if (j) setJobs(j.jobCards ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const filteredBookings = useMemo(() => {
    if (tab === 'upcoming') return bookings.filter((b) => b.status === 'confirmed' && b.date >= today);
    if (tab === 'in-progress') return [];
    if (tab === 'completed') return [];
    return bookings;
  }, [bookings, tab, today]);

  const filteredJobs = useMemo(() => {
    if (tab === 'in-progress') return jobs.filter((j) => j.status === 'in_progress' || j.status === 'approved');
    if (tab === 'completed') return jobs.filter((j) => j.status === 'completed');
    if (tab === 'all') return jobs;
    return jobs.filter((j) => j.status === 'pending');
  }, [jobs, tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Bookings &amp; Service History</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">All your visits with Car Affair, in one place.</p>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>
      ) : (
        <div className="space-y-6">
          {tab === 'upcoming' && filteredBookings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Upcoming visits</h2>
              {filteredBookings.map((b) => (
                <div key={b.id} className="glass rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{b.vehicleSummary || b.registrationNumber}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{bookingDateLabel(b.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    {format12h(b.startTime)} – {format12h(b.endTime)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredJobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Service jobs</h2>
              {filteredJobs.map((j) => {
                const tone = jobStatusTone[j.status] ?? jobStatusTone.pending;
                return (
                  <Link
                    key={j.id}
                    href={`/me/jobs/${j.id}`}
                    className="glass rounded-2xl p-5 flex items-center justify-between gap-4 hover:bg-[var(--bg-glass-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{j.vehicleName}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                          {j.licensePlate} · {j.createdAt ? formatDate(j.createdAt) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${tone}`}>
                        {jobStatusLabel[j.status]}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {filteredBookings.length === 0 && filteredJobs.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Calendar className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[var(--text-tertiary)]">Nothing in this view yet.</p>
              {tab === 'upcoming' && (
                <Link href="/book" className="inline-block mt-3 text-sm text-red-500 hover:text-red-400 font-medium">
                  Book a service →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
