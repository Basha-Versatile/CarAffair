'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Wrench, Package, FileText, AlertTriangle, Check, Camera, Clock, MapPin } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { respondToQuote } from '@/features/jobCards/jobCardSlice';
import { updateNotificationsByToken, addAlert } from '@/features/notifications/notificationSlice';
import { formatCurrency, formatDate, generateId } from '@/utils/format';
import { GST_RATE } from '@/types';

export default function QuoteApprovalPage() {
  const params = useParams();
  const token = params.token as string;
  const dispatch = useAppDispatch();
  const [customerNote, setCustomerNote] = useState('');
  const [responded, setResponded] = useState(false);
  const [approvedServiceIds, setApprovedServiceIds] = useState<Set<string>>(new Set());
  const [approvedPartIds, setApprovedPartIds] = useState<Set<string>>(new Set());

  const jobCard = useAppSelector((state) =>
    state.jobCards.jobCards.find((j) => j.quoteToken === token)
  );

  // Default-select every line item once the quote loads (or after a status change clears the response state).
  useEffect(() => {
    if (!jobCard) return;
    setApprovedServiceIds(new Set(jobCard.services.map((s) => s.id)));
    setApprovedPartIds(new Set(jobCard.parts.map((p) => p.id)));
  }, [jobCard?.id, jobCard?.quoteStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleService = (id: string) => {
    setApprovedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const togglePart = (id: string) => {
    setApprovedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const approvedServicesCost = useMemo(
    () => (jobCard?.services ?? []).filter((s) => approvedServiceIds.has(s.id)).reduce((sum, s) => sum + s.cost, 0),
    [jobCard, approvedServiceIds]
  );
  const approvedPartsCost = useMemo(
    () => (jobCard?.parts ?? []).filter((p) => approvedPartIds.has(p.id)).reduce((sum, p) => sum + p.totalCost, 0),
    [jobCard, approvedPartIds]
  );
  const approvedSubtotal = approvedServicesCost + approvedPartsCost;
  const quoteType = jobCard?.quoteType ?? 'with_gst';
  const approvedTax = quoteType === 'with_gst' ? Math.round(approvedSubtotal * (GST_RATE / 100)) : 0;
  const approvedTotal = approvedSubtotal + approvedTax;
  const nothingApproved = approvedServiceIds.size === 0 && approvedPartIds.size === 0;

  const handleResponse = (action: 'accepted' | 'rejected') => {
    if (!jobCard) return;
    if (action === 'accepted' && nothingApproved) return;
    dispatch(respondToQuote({
      token,
      action,
      ...(action === 'accepted' ? {
        approvedServiceIds: Array.from(approvedServiceIds),
        approvedPartIds: Array.from(approvedPartIds),
      } : {}),
    }));
    dispatch(updateNotificationsByToken({
      quoteToken: token,
      status: action,
      timestamp: new Date().toISOString(),
    }));
    const alertAmount = action === 'accepted' ? approvedTotal : jobCard.estimatedCost;
    dispatch(addAlert({
      id: `alert-${generateId()}`,
      type: action === 'accepted' ? 'quote_accepted' : 'quote_rejected',
      title: action === 'accepted' ? 'Quote Approved' : 'Quote Declined',
      message: `${jobCard.customerName} has ${action} the quote for ${jobCard.vehicleName} (${formatCurrency(alertAmount)})`,
      customerName: jobCard.customerName,
      vehicleName: jobCard.vehicleName,
      read: false,
      createdAt: new Date().toISOString(),
    }));
    setResponded(true);
  };

  if (!jobCard) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Quote Not Found</h1>
          <p className="text-[var(--text-tertiary)]">This quote link is invalid or has expired. Please contact Car Affair for assistance.</p>
        </motion.div>
      </div>
    );
  }

  const alreadyResponded = jobCard.quoteStatus === 'accepted' || jobCard.quoteStatus === 'rejected';
  const showActions = !alreadyResponded && !responded;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 65%)' }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <Image src="/logo.png" alt="Car Affair" width={512} height={100} className="w-32 h-auto logo-adaptive" priority />
          <div className="ml-auto text-right">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium">
              {quoteType === 'proforma' ? 'Proforma Estimate' : 'Service Estimate'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{jobCard.id}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {(responded || alreadyResponded) ? (
            <motion.div key="response" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="text-center py-20">
              {(jobCard.quoteStatus === 'accepted') ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-[var(--text-primary)] mb-3">Quote Approved!</motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                    Thank you, {jobCard.customerName}. Our team will begin working on your {jobCard.vehicleName} shortly.
                  </motion.p>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-[var(--text-primary)] mb-3">Quote Declined</motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                    We understand, {jobCard.customerName}. Please contact us if you&apos;d like to discuss the estimate further.
                  </motion.p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="quote" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="space-y-6">
              {/* Vehicle info */}
              <div className="p-6 rounded-2xl glass">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-1">Vehicle</p>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{jobCard.vehicleName}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{jobCard.licensePlate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-1">Customer</p>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{jobCard.customerName}</p>
                    <p className="text-[var(--text-tertiary)] text-xs mt-1">{formatDate(jobCard.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div className="p-5 rounded-2xl glass">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Reported Issues</p>
                </div>
                <ul className="text-[var(--text-secondary)] text-sm leading-relaxed list-disc list-inside space-y-1">
                  {jobCard.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>

              {/* Vehicle photos captured during inspection */}
              {jobCard.photos && jobCard.photos.length > 0 && (
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-red-500" />
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Inspection Photos</p>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Each photo is time &amp; location stamped</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {jobCard.photos.map((photo) => (
                      <a key={photo.id} href={photo.dataUrl} target="_blank" rel="noreferrer" className="relative rounded-xl overflow-hidden border border-[var(--border-color)] block aspect-square group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.dataUrl} alt="vehicle inspection" className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                          <p className="text-[10px] text-white/90 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(photo.capturedAt).toLocaleString()}
                          </p>
                          {photo.locationLabel && (
                            <p className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {photo.locationLabel}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {showActions && (jobCard.services.length > 0 || jobCard.parts.length > 0) && (
                <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--text-secondary)]">
                  Tick the services and parts you&apos;d like us to carry out. Unchecked items will be excluded from the work order.
                </div>
              )}

              {/* Services */}
              {jobCard.services.length > 0 && (
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Services</p>
                  </div>
                  <div className="space-y-2">
                    {jobCard.services.map((service) => {
                      const checked = approvedServiceIds.has(service.id);
                      const rowClasses = showActions
                        ? `flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl cursor-pointer transition-colors ${checked ? 'hover:bg-[var(--bg-tertiary)]' : 'opacity-50 hover:opacity-75'}`
                        : 'flex items-center gap-3 p-2.5 -mx-2.5';
                      return (
                        <label key={service.id} className={rowClasses}>
                          {showActions && (
                            <span className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked ? 'bg-red-500 border-red-500' : 'bg-transparent border-[var(--border-color)]'}`}>
                              {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            disabled={!showActions}
                            onChange={() => toggleService(service.id)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${checked ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] line-through'}`}>{service.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{service.description} &middot; {service.laborHours}h labor</p>
                          </div>
                          <p className={`text-sm font-semibold ${checked ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] line-through'}`}>{formatCurrency(service.cost)}</p>
                        </label>
                      );
                    })}
                    <div className="pt-3 mt-1 border-t border-[var(--border-color)] flex justify-between">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">Services Subtotal</p>
                      <p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(approvedServicesCost)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parts */}
              {jobCard.parts.length > 0 && (
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Parts Required</p>
                  </div>
                  <div className="space-y-2">
                    {jobCard.parts.map((part) => {
                      const checked = approvedPartIds.has(part.id);
                      const rowClasses = showActions
                        ? `flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl cursor-pointer transition-colors ${checked ? 'hover:bg-[var(--bg-tertiary)]' : 'opacity-50 hover:opacity-75'}`
                        : 'flex items-center gap-3 p-2.5 -mx-2.5';
                      return (
                        <label key={part.id} className={rowClasses}>
                          {showActions && (
                            <span className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked ? 'bg-red-500 border-red-500' : 'bg-transparent border-[var(--border-color)]'}`}>
                              {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            disabled={!showActions}
                            onChange={() => togglePart(part.id)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${checked ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] line-through'}`}>{part.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">Part #{part.partNumber} &middot; Qty: {part.quantity}</p>
                          </div>
                          <p className={`text-sm font-semibold ${checked ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] line-through'}`}>{formatCurrency(part.totalCost)}</p>
                        </label>
                      );
                    })}
                    <div className="pt-3 mt-1 border-t border-[var(--border-color)] flex justify-between">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">Parts Subtotal</p>
                      <p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(approvedPartsCost)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 space-y-2.5">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(showActions ? approvedSubtotal : (jobCard.quoteSubtotal ?? jobCard.estimatedCost))}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>GST ({GST_RATE}%)</span>
                  <span>
                    {quoteType === 'with_gst'
                      ? formatCurrency(showActions ? approvedTax : (jobCard.quoteTaxAmount ?? 0))
                      : <span className="text-amber-500 text-xs uppercase tracking-wide font-semibold">Not applicable (proforma)</span>}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-red-500/20 flex items-center justify-between">
                  <p className="text-[var(--text-secondary)] font-medium">{showActions ? 'Approved Total' : 'Total'}</p>
                  <p className="text-3xl font-black gradient-text">{formatCurrency(showActions ? approvedTotal : (jobCard.quoteTotal ?? jobCard.estimatedCost))}</p>
                </div>
              </motion.div>

              {/* Customer note */}
              {showActions && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-2 block">Add a note (optional)</label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Any questions or concerns about this estimate..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-red-500/40 resize-none transition-colors backdrop-blur-sm"
                  />
                </div>
              )}

              {/* Action buttons */}
              {showActions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2 pt-2">
                  {nothingApproved && (
                    <p className="text-xs text-yellow-500 text-center">Select at least one service or part to accept the quote.</p>
                  )}
                  <div className="flex gap-4">
                    <motion.button whileHover={nothingApproved ? undefined : { scale: 1.02 }} whileTap={nothingApproved ? undefined : { scale: 0.98 }} onClick={() => handleResponse('accepted')} disabled={nothingApproved}
                      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-emerald-700">
                      <CheckCircle className="w-5 h-5" /> Accept Quote
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleResponse('rejected')}
                      className="flex-1 py-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all cursor-pointer">
                      <XCircle className="w-5 h-5" /> Decline Quote
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-[var(--border-color)] text-center">
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  This estimate is valid for 7 days from the date of inspection. Prices may vary based on additional findings during service.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
