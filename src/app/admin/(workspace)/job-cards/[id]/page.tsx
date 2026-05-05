'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Car, ClipboardList, User, Phone, Wrench, Package,
  CheckCircle, Clock, Send, XCircle, FileText, Camera, ImageOff,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateJobCardStatus } from '@/features/jobCards/jobCardSlice';
import { simulateSendStatusNotification } from '@/services/notificationService';
import { api } from '@/lib/apiClient';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import type { JobCard, JobCardStatus, QuoteStatus } from '@/types';

const statusConfig: Record<JobCardStatus, { variant: 'warning' | 'info' | 'purple' | 'success'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'purple', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
};

const quoteStatusConfig: Record<QuoteStatus, { icon: typeof CheckCircle; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Quote Pending', className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  sent: { icon: Send, label: 'Quote Sent', className: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  accepted: { icon: CheckCircle, label: 'Quote Accepted by Customer', className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { icon: XCircle, label: 'Quote Rejected', className: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

export default function JobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const id = params.id as string;
  const me = useAppSelector((s) => s.auth.user);

  const [job, setJob] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAdmin = me?.role === 'admin' || me?.role === 'staff';
  const isAdvisor = me?.role === 'service_advisor';
  const isReadOnly = me?.role === 'mechanic' || me?.role === 'primary_technician';
  const canUpdateStatus = isAdmin || isAdvisor;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ jobCard: JobCard }>(`/api/job-cards/${id}`)
      .then((res) => {
        if (!cancelled) setJob(res.jobCard);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load job');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // For non-admin roles (where the job had prices stripped server-side), the
  // approval-aware filtering of services/parts uses the approvedServiceIds /
  // approvedPartIds arrays the customer set when accepting the quote.
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

  const handleStatusChange = async (newStatus: JobCardStatus) => {
    if (!job || !canUpdateStatus) return;
    setUpdatingStatus(true);
    try {
      const result = await dispatch(updateJobCardStatus({ id: job.id, status: newStatus }));
      if (updateJobCardStatus.fulfilled.match(result)) {
        setJob({ ...job, status: newStatus });
        toast.success('Status updated', `Marked as ${newStatus.replace('_', ' ')}`);
        if (isAdmin) {
          simulateSendStatusNotification(dispatch, job, newStatus);
          toast.info('Customer notified', `Status update sent to ${job.customerName}`);
        }
      } else {
        toast.error('Update failed', 'Try again');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass rounded-2xl p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">{error ?? 'Job not found.'}</p>
        </div>
      </div>
    );
  }

  const statusBadge = statusConfig[job.status];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => router.push('/admin/job-cards')}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>
        {canUpdateStatus && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Status</span>
            <select
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value as JobCardStatus)}
              disabled={updatingStatus}
              className="px-3 py-2 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{job.vehicleName}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{job.licensePlate}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Job ID #{job.id}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            {job.quoteStatus && (() => {
              const qc = quoteStatusConfig[job.quoteStatus];
              const QIcon = qc.icon;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${qc.className}`}>
                  <QIcon className="w-3.5 h-3.5" />{qc.label}
                </span>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* Grid: Customer + Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Customer</h2>
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">{job.customerName}</p>
          {!isReadOnly && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact via admin
            </p>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Vehicle</h2>
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">{job.vehicleName}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">License plate: {job.licensePlate}</p>
        </div>
      </div>

      {/* Issues */}
      {job.issues && job.issues.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Issues Reported</h2>
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

      {/* Services */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              {job.quoteStatus === 'accepted' ? 'Approved Services' : 'Services'}
            </h2>
          </div>
          {visibleServices.length > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">{visibleServices.length} item{visibleServices.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {visibleServices.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No services on this job.</p>
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

      {/* Parts */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              {job.quoteStatus === 'accepted' ? 'Approved Parts' : 'Parts'}
            </h2>
          </div>
          {visibleParts.length > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">{visibleParts.length} item{visibleParts.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {visibleParts.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No parts on this job.</p>
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

      {/* Photos */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-red-500" />
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Vehicle Photos</h2>
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
            <p className="text-sm">No photos attached.</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Notes</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{job.notes}</p>
        </div>
      )}
    </div>
  );
}
