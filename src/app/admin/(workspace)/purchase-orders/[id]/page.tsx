'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Truck, CheckCircle2, XCircle, Send, Package,
  Calendar, AlertTriangle, Copy, Check, Trash2, Clock,
} from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import {
  updatePurchaseOrderThunk, deletePurchaseOrderThunk, fetchPurchaseOrders,
  type POAction,
} from '@/features/purchaseOrders/purchaseOrdersSlice';
import { createInventoryItem, fetchInventory } from '@/features/inventory/inventorySlice';
import { api } from '@/lib/apiClient';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/utils/format';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

const statusConfig: Record<PurchaseOrderStatus, { variant: 'warning' | 'info' | 'purple' | 'success' | 'default'; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  requested: { variant: 'warning', label: 'Requested' },
  quoted: { variant: 'info', label: 'Quoted' },
  accepted: { variant: 'purple', label: 'Accepted' },
  rejected: { variant: 'default', label: 'Rejected' },
  dispatched: { variant: 'info', label: 'Dispatched' },
  received: { variant: 'success', label: 'Received' },
  cancelled: { variant: 'default', label: 'Cancelled' },
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const id = params.id as string;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Custom-item → inventory prompt state
  interface AddRow {
    poItemId: string;
    name: string;
    partNumber: string;
    category: string;
    quantity: number;
    unitCost: number;
    reorderLevel: number;
    supplier: string;
    selected: boolean;
  }
  const addToInventoryModal = useModal();
  const [addRows, setAddRows] = useState<AddRow[]>([]);
  const [addingToInventory, setAddingToInventory] = useState(false);

  // Confirm dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ purchaseOrder: PurchaseOrder }>(`/api/purchase-orders/${id}`);
      setPO(res.purchaseOrder);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    if (!po) return { items: 0, units: 0, value: 0 };
    return po.items.reduce(
      (acc, it) => ({
        items: acc.items + 1,
        units: acc.units + it.quantity,
        value: acc.value + (it.unitPrice ?? 0) * it.quantity,
      }),
      { items: 0, units: 0, value: 0 }
    );
  }, [po]);

  const vendorUrl = useMemo(() => {
    if (typeof window === 'undefined' || !po?.vendorToken) return '';
    return `${window.location.origin}/vendor/${po.vendorToken}`;
  }, [po]);

  const runAction = async (action: POAction, payload?: { reason?: string }) => {
    if (!po) return;
    setActing(true);
    try {
      const res = await dispatch(updatePurchaseOrderThunk({ id: po.id, action, ...payload })).unwrap();
      setPO(res);
      dispatch(fetchPurchaseOrders());
      const labels: Record<POAction, string> = {
        send: 'Purchase order sent',
        accept: 'Quote accepted',
        reject: 'Quote rejected',
        dispatch: 'Marked as dispatched',
        receive: 'Marked as received — inventory updated',
        cancel: 'Purchase order cancelled',
        'edit-items': 'Items updated',
      };
      toast.success(labels[action], '');

      // After receiving, prompt to add custom (non-inventory-linked) items to inventory.
      if (action === 'receive') {
        const customs = res.items.filter(
          (it) => !it.inventoryItemId && typeof it.unitPrice === 'number' && it.unitPrice > 0
        );
        if (customs.length > 0) {
          setAddRows(customs.map((it) => ({
            poItemId: it.id,
            name: it.name,
            partNumber: it.partNumber ?? '',
            category: 'General',
            quantity: it.quantity,
            unitCost: it.unitPrice ?? 0,
            reorderLevel: Math.max(1, Math.ceil(it.quantity / 4)),
            supplier: res.vendorName,
            selected: true,
          })));
          addToInventoryModal.open();
        }
      }
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setActing(false);
    }
  };

  const submitAddToInventory = async () => {
    const selected = addRows.filter((r) => r.selected);
    if (selected.length === 0) {
      addToInventoryModal.close();
      return;
    }
    for (const r of selected) {
      if (!r.name.trim() || !r.partNumber.trim() || !r.category.trim()) {
        toast.error('Missing fields', `${r.name || 'item'}: name, part number and category are required.`);
        return;
      }
    }
    setAddingToInventory(true);
    try {
      for (const r of selected) {
        await dispatch(createInventoryItem({
          name: r.name.trim(),
          partNumber: r.partNumber.trim(),
          category: r.category.trim(),
          quantity: r.quantity,
          unitCost: r.unitCost,
          reorderLevel: r.reorderLevel,
          supplier: r.supplier.trim(),
        })).unwrap();
      }
      dispatch(fetchInventory());
      toast.success('Added to inventory', `${selected.length} item${selected.length !== 1 ? 's' : ''} added.`);
      addToInventoryModal.close();
    } catch (err) {
      toast.error('Could not add', err instanceof Error ? err.message : 'Try again');
    } finally {
      setAddingToInventory(false);
    }
  };

  const performDelete = async () => {
    if (!po) return;
    try {
      await dispatch(deletePurchaseOrderThunk(po.id)).unwrap();
      toast.error('Draft deleted', '');
      router.push('/admin/purchase-orders');
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass rounded-2xl p-12 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-yellow-400 mb-3" />
          <p className="text-[var(--text-tertiary)]">{error ?? 'Purchase order not found.'}</p>
        </div>
      </div>
    );
  }

  const sc = statusConfig[po.status];
  const showVendorLink = po.status === 'requested' || po.status === 'quoted' || po.status === 'accepted' || po.status === 'dispatched';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => router.push('/admin/purchase-orders')}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Purchase Orders
        </button>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </div>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{po.vendorName}</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Purchase Order #{po.id.slice(-6)}</p>
              {po.relatedJobCardId && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Linked to job #{po.relatedJobCardId.slice(-6)}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Total Value</p>
            {totals.value > 0 ? (
              <p className="text-2xl font-bold gradient-text">₹ {totals.value.toLocaleString('en-IN')}</p>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Quote pending</p>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{totals.items} line{totals.items !== 1 ? 's' : ''} · {totals.units} unit{totals.units !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </motion.div>

      {/* Vendor link panel */}
      {showVendorLink && vendorUrl && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Send className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Vendor link</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 mb-2">Share this link with the vendor. In production it&apos;s emailed automatically.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono text-[var(--text-secondary)] truncate">{vendorUrl}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(vendorUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2">
          <Package className="h-4 w-4 text-red-500" />
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Line Items</h2>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {po.items.map((it) => {
            const lineTotal = (it.unitPrice ?? 0) * it.quantity;
            return (
              <div key={it.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{it.name}</p>
                    {it.partNumber && (
                      <p className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">#{it.partNumber}</p>
                    )}
                    {it.notes && <p className="text-xs text-[var(--text-secondary)] mt-1">{it.notes}</p>}
                    {it.vendorNote && (
                      <p className="text-xs text-blue-400 mt-1">Vendor note: {it.vendorNote}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)]">Qty</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{it.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)]">Unit price</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {typeof it.unitPrice === 'number' ? `₹ ${it.unitPrice.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)]">Line total</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {lineTotal > 0 ? `₹ ${lineTotal.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                  {typeof it.availableInDays === 'number' && (
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-tertiary)]">Available in</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{it.availableInDays} day{it.availableInDays !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {totals.value > 0 && (
          <div className="px-5 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Total</span>
            <span className="text-lg font-bold gradient-text">₹ {totals.value.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-2">Notes for Vendor</h2>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{po.notes}</p>
        </div>
      )}
      {po.rejectionReason && (po.status === 'rejected' || po.status === 'cancelled') && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-2">Reason</h2>
          <p className="text-sm text-amber-200 whitespace-pre-wrap">{po.rejectionReason}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-red-500" />
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Timeline</h2>
        </div>
        <div className="space-y-2 text-sm">
          {po.createdAt && <TimelineRow label="Created" at={po.createdAt} icon={<Clock className="h-3.5 w-3.5" />} />}
          {po.sentAt && <TimelineRow label="Sent to vendor" at={po.sentAt} icon={<Send className="h-3.5 w-3.5" />} />}
          {po.quotedAt && <TimelineRow label="Vendor quoted" at={po.quotedAt} icon={<ShoppingCart className="h-3.5 w-3.5" />} />}
          {po.acceptedAt && <TimelineRow label="Quote accepted" at={po.acceptedAt} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} />}
          {po.rejectedAt && <TimelineRow label="Quote rejected" at={po.rejectedAt} icon={<XCircle className="h-3.5 w-3.5 text-red-500" />} />}
          {po.dispatchedAt && <TimelineRow label="Vendor dispatched" at={po.dispatchedAt} icon={<Truck className="h-3.5 w-3.5" />} />}
          {po.receivedAt && <TimelineRow label="Received in stock" at={po.receivedAt} icon={<Package className="h-3.5 w-3.5 text-emerald-500" />} />}
          {po.cancelledAt && <TimelineRow label="Cancelled" at={po.cancelledAt} icon={<XCircle className="h-3.5 w-3.5" />} />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 sticky bottom-4">
        {po.status === 'draft' && (
          <>
            <Button onClick={() => runAction('send')} isLoading={acting} icon={<Send className="h-4 w-4" />}>Send to Vendor</Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(true)} icon={<Trash2 className="h-4 w-4" />}>Delete Draft</Button>
          </>
        )}
        {po.status === 'requested' && (
          <Button variant="secondary" onClick={() => runAction('cancel')} isLoading={acting} icon={<XCircle className="h-4 w-4" />}>Cancel</Button>
        )}
        {po.status === 'quoted' && (
          <>
            <Button onClick={() => runAction('accept')} isLoading={acting} icon={<CheckCircle2 className="h-4 w-4" />}>Accept Quote</Button>
            <Button variant="secondary" onClick={() => setShowRejectPrompt(true)} isLoading={acting} icon={<XCircle className="h-4 w-4" />}>Reject Quote</Button>
            <Button variant="secondary" onClick={() => runAction('cancel')} isLoading={acting}>Cancel</Button>
          </>
        )}
        {po.status === 'accepted' && (
          <>
            <Button variant="secondary" onClick={() => runAction('dispatch')} isLoading={acting} icon={<Truck className="h-4 w-4" />}>Mark Dispatched (manual)</Button>
            <Button variant="secondary" onClick={() => runAction('cancel')} isLoading={acting}>Cancel</Button>
          </>
        )}
        {po.status === 'dispatched' && (
          <Button onClick={() => runAction('receive')} isLoading={acting} icon={<Package className="h-4 w-4" />}>Mark Received</Button>
        )}
      </div>

      {/* Custom items → inventory prompt */}
      <Modal isOpen={addToInventoryModal.isOpen} onClose={addToInventoryModal.close} title="Add received items to inventory?" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            These items weren&apos;t linked to existing inventory rows. Add them now so they&apos;re tracked for future jobs.
          </p>
          <div className="space-y-3">
            {addRows.map((row, idx) => (
              <div
                key={row.poItemId}
                className={`rounded-xl border p-4 transition-colors ${row.selected ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]'}`}
              >
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: e.target.checked } : r))}
                    className="h-4 w-4 accent-red-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{row.name}</span>
                </label>
                {row.selected && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input id={`add-name-${row.poItemId}`} label="Name" value={row.name} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))} />
                    <Input id={`add-pn-${row.poItemId}`} label="Part #" value={row.partNumber} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, partNumber: e.target.value } : r))} />
                    <Input id={`add-cat-${row.poItemId}`} label="Category" value={row.category} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, category: e.target.value } : r))} />
                    <Input id={`add-sup-${row.poItemId}`} label="Supplier" value={row.supplier} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, supplier: e.target.value } : r))} />
                    <Input id={`add-qty-${row.poItemId}`} type="number" label="Quantity" value={String(row.quantity)} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, quantity: Math.max(0, Number(e.target.value) || 0) } : r))} />
                    <Input id={`add-cost-${row.poItemId}`} type="number" label="Unit cost (₹)" value={String(row.unitCost)} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, unitCost: Math.max(0, Number(e.target.value) || 0) } : r))} />
                    <Input id={`add-reorder-${row.poItemId}`} type="number" label="Reorder level" value={String(row.reorderLevel)} onChange={(e) => setAddRows((prev) => prev.map((r, i) => i === idx ? { ...r, reorderLevel: Math.max(0, Number(e.target.value) || 0) } : r))} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={addToInventoryModal.close} className="flex-1">Skip</Button>
            <Button type="button" onClick={submitAddToInventory} isLoading={addingToInventory} className="flex-1">
              Add {addRows.filter((r) => r.selected).length} to Inventory
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete draft purchase order"
        message="This cannot be undone. The draft and its items will be permanently removed."
        confirmLabel="Delete draft"
        destructive
        onConfirm={performDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showRejectPrompt}
        title="Reject vendor's quote"
        message="The vendor will see the rejection. You can leave a short reason — optional."
        confirmLabel="Reject quote"
        destructive
        promptLabel="Reason (optional)"
        promptPlaceholder="Too expensive / wrong availability / will use another vendor…"
        onConfirm={async (reason) => {
          setShowRejectPrompt(false);
          await runAction('reject', { reason: reason || undefined });
        }}
        onClose={() => setShowRejectPrompt(false)}
      />
    </div>
  );
}

function TimelineRow({ label, at, icon }: { label: string; at: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)]">{icon}</span>
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="ml-auto text-xs text-[var(--text-tertiary)]">{formatDateTime(at)}</span>
    </div>
  );
}
