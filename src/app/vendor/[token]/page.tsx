'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingCart, AlertTriangle, CheckCircle2, Truck, Send, Package, Clock,
} from 'lucide-react';
import { api } from '@/lib/apiClient';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/types';

const statusLabel: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  requested: 'Awaiting your quote',
  quoted: 'Quote submitted — admin reviewing',
  accepted: 'Admin accepted — ready to dispatch',
  rejected: 'Admin rejected the quote',
  dispatched: 'Marked as dispatched',
  received: 'Delivered and received',
  cancelled: 'Cancelled',
};

interface QuoteRow {
  id: string;
  unitPrice: string;
  availableInDays: string;
  vendorNote: string;
}

export default function VendorPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quoteRows, setQuoteRows] = useState<QuoteRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ purchaseOrder: PurchaseOrder }>(`/api/vendor/${token}`);
      setPO(res.purchaseOrder);
      setQuoteRows(
        res.purchaseOrder.items.map((it) => ({
          id: it.id,
          unitPrice: typeof it.unitPrice === 'number' ? String(it.unitPrice) : '',
          availableInDays: typeof it.availableInDays === 'number' ? String(it.availableInDays) : '',
          vendorNote: it.vendorNote ?? '',
        }))
      );
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalValue = useMemo(() => {
    return quoteRows.reduce((sum, r) => {
      const item = po?.items.find((i) => i.id === r.id);
      const qty = item?.quantity ?? 0;
      const price = Number(r.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [quoteRows, po]);

  const updateRow = (id: string, patch: Partial<QuoteRow>) => {
    setQuoteRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const submitQuote = async () => {
    setSubmitError(null);
    for (const r of quoteRows) {
      const price = Number(r.unitPrice);
      if (!Number.isFinite(price) || price <= 0) {
        setSubmitError('Please enter a unit price greater than 0 for every item.');
        return;
      }
    }
    setSubmitting(true);
    try {
      await api.post(`/api/vendor/${token}`, {
        action: 'quote',
        items: quoteRows.map((r) => ({
          id: r.id,
          unitPrice: Number(r.unitPrice),
          availableInDays: r.availableInDays ? Number(r.availableInDays) : undefined,
          vendorNote: r.vendorNote || undefined,
        })),
      });
      await reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDispatch = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/vendor/${token}`, { action: 'dispatch' });
      await reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not mark dispatched');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <p className="text-sm text-[var(--text-tertiary)] animate-pulse">Loading purchase order…</p>
      </div>
    );
  }

  if (loadError || !po) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Purchase order link unavailable</h1>
          <p className="text-[var(--text-tertiary)]">{loadError ?? 'This link is invalid.'}</p>
        </motion.div>
      </div>
    );
  }

  const isQuoteable = po.status === 'requested' || po.status === 'quoted';
  const isDispatchable = po.status === 'accepted';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-10 px-5">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Car Affair · Purchase Order</h1>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">For {po.vendorName} · #{po.id.slice(-6)}</p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
              {statusLabel[po.status]}
            </span>
          </div>
          {po.notes && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Notes from admin</p>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </motion.div>

        {/* Items */}
        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2">
            <Package className="h-4 w-4 text-red-500" />
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Items requested</h2>
          </div>

          <div className="divide-y divide-[var(--border-color)]">
            {po.items.map((it: PurchaseOrderItem) => {
              const row = quoteRows.find((r) => r.id === it.id);
              return (
                <div key={it.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{it.name}</p>
                      {it.partNumber && <p className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">#{it.partNumber}</p>}
                      {it.notes && <p className="text-xs text-[var(--text-secondary)] mt-1">{it.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-tertiary)]">Qty</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">{it.quantity}</p>
                    </div>
                  </div>

                  {isQuoteable ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Unit price (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={row?.unitPrice ?? ''}
                          onChange={(e) => updateRow(it.id, { unitPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Available in (days)</label>
                        <input
                          type="number"
                          min={0}
                          value={row?.availableInDays ?? ''}
                          onChange={(e) => updateRow(it.id, { availableInDays: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Note (optional)</label>
                        <input
                          type="text"
                          value={row?.vendorNote ?? ''}
                          onChange={(e) => updateRow(it.id, { vendorNote: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          placeholder="OEM only, etc."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Unit price</p>
                        <p className="font-semibold text-[var(--text-primary)]">{typeof it.unitPrice === 'number' ? `₹ ${it.unitPrice.toLocaleString('en-IN')}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Available in</p>
                        <p className="font-semibold text-[var(--text-primary)]">{typeof it.availableInDays === 'number' ? `${it.availableInDays} day${it.availableInDays !== 1 ? 's' : ''}` : '—'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Note</p>
                        <p className="font-medium text-[var(--text-secondary)]">{it.vendorNote ?? '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {(isQuoteable || (typeof totalValue === 'number' && totalValue > 0)) && (
            <div className="px-5 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-secondary)]">Total quote</span>
              <span className="text-lg font-bold gradient-text">
                ₹ {(isQuoteable ? totalValue : po.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0)).toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {submitError && (
          <p className="text-sm text-red-500 text-center">{submitError}</p>
        )}

        {isQuoteable && (
          <button
            type="button"
            onClick={submitQuote}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
          >
            {submitting ? 'Submitting…' : po.status === 'quoted' ? <>Update Quote <Send className="h-4 w-4" /></> : <>Submit Quote <Send className="h-4 w-4" /></>}
          </button>
        )}

        {isDispatchable && (
          <button
            type="button"
            onClick={submitDispatch}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white disabled:opacity-50 cursor-pointer hover:from-emerald-500 hover:to-emerald-600 transition-all"
          >
            {submitting ? 'Saving…' : <>Mark Dispatched <Truck className="h-4 w-4" /></>}
          </button>
        )}

        {(po.status === 'rejected' || po.status === 'cancelled' || po.status === 'received') && (
          <div className="glass-panel p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">{statusLabel[po.status]}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">No further action needed.</p>
          </div>
        )}

        {(po.status === 'quoted' || po.status === 'dispatched') && !isQuoteable && !isDispatchable && (
          <div className="text-center text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Waiting for the next step from admin.
          </div>
        )}
      </div>
    </div>
  );
}
