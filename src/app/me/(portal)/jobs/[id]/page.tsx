'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Car, Wrench, Package, Camera, FileText, ImageOff,
  CheckCircle, Clock, Send, XCircle, AlertTriangle, ClipboardList,
} from 'lucide-react';
import { api } from '@/lib/apiClient';
import { formatDate } from '@/utils/format';
import type { JobCard, QuoteStatus } from '@/types';

const statusLabel: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved', tone: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', tone: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  completed: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const quoteStatusLabel: Record<QuoteStatus, { label: string; tone: string; icon: typeof Clock }> = {
  pending: { label: 'Quote Pending', tone: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  sent: { label: 'Quote Sent — please review', tone: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Send },
  accepted: { label: 'Quote Accepted', tone: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'Quote Declined', tone: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
};

export default function CustomerJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<{ jobCard: JobCard }>(`/api/me/jobs/${id}`)
      .then((res) => { if (!cancelled) setJob(res.jobCard); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load job'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const visibleServices = useMemo(() => {
    if (!job) return [];
    if (job.quoteStatus === 'accepted' && Array.isArray(job.approvedServiceIds) && job.approvedServiceIds.length > 0) {
      const set = new Set(job.approvedServiceIds);
      return job.services.filter((s) => set.has(s.id));
    }
    return job.services;
  }, [job]);

  const visibleParts = useMemo(() => {
    if (!job) return [];
    if (job.quoteStatus === 'accepted' && Array.isArray(job.approvedPartIds) && job.approvedPartIds.length > 0) {
      const set = new Set(job.approvedPartIds);
      return job.parts.filter((p) => set.has(p.id));
    }
    return job.parts;
  }, [job]);

  if (loading) {
    return <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>;
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass rounded-2xl p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
          <p className="text-[var(--text-tertiary)]">{error ?? 'Job not found.'}</p>
        </div>
      </div>
    );
  }

  const sl = statusLabel[job.status] ?? statusLabel.pending;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/me/bookings')}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{job.vehicleName}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{job.licensePlate}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Started {job.createdAt ? formatDate(job.createdAt) : '—'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-md border text-xs font-semibold ${sl.tone}`}>{sl.label}</span>
            {job.quoteStatus && (() => {
              const qc = quoteStatusLabel[job.quoteStatus];
              const QIcon = qc.icon;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${qc.tone}`}>
                  <QIcon className="w-3.5 h-3.5" /> {qc.label}
                </span>
              );
            })()}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Vehicle</h2>
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">{job.vehicleName}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">License plate: {job.licensePlate}</p>
        </div>

        {job.publicNotes && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-red-500" />
              <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">A note from the workshop</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{job.publicNotes}</p>
          </div>
        )}
      </div>

      {job.issues && job.issues.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">What you reported</h2>
          </div>
          <ul className="space-y-1.5">
            {job.issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              {job.quoteStatus === 'accepted' ? 'Approved services' : 'Services proposed'}
            </h2>
          </div>
          {visibleServices.length > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">{visibleServices.length} item{visibleServices.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {visibleServices.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No services on this job yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                  {s.description && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.description}</p>}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">{s.laborHours}h labor</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              {job.quoteStatus === 'accepted' ? 'Approved parts' : 'Parts proposed'}
            </h2>
          </div>
          {visibleParts.length > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">{visibleParts.length} item{visibleParts.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {visibleParts.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No parts on this job yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleParts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
                  {p.partNumber && <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">#{p.partNumber}</p>}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">Qty: {p.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-red-500" />
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Photos from the workshop</h2>
        </div>
        {job.photos && job.photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {job.photos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={`Vehicle photo ${p.id}`} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
            <ImageOff className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No photos yet — the workshop adds these as service progresses.</p>
          </div>
        )}
      </div>
    </div>
  );
}
