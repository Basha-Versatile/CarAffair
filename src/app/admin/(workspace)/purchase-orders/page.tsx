'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus, ShoppingCart, X, Send, FileText,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVendors } from '@/features/vendors/vendorsSlice';
import { fetchPurchaseOrders, createPurchaseOrderThunk } from '@/features/purchaseOrders/purchaseOrdersSlice';
import { fetchInventory } from '@/features/inventory/inventorySlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useModal } from '@/hooks/useModal';
import { Skeleton, SkeletonHeader } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
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

const STATUS_FILTERS: (PurchaseOrderStatus | 'all')[] = [
  'all', 'draft', 'requested', 'quoted', 'accepted', 'dispatched', 'received', 'rejected', 'cancelled',
];

interface DraftItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  partNumber: string;
  quantity: number;
  notes: string;
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const blankItem = (): DraftItem => ({ id: genId(), name: '', partNumber: '', quantity: 1, notes: '' });

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={null}>
      <PurchaseOrdersInner />
    </Suspense>
  );
}

function PurchaseOrdersInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const createModal = useModal();
  const { orders, isLoading } = useAppSelector((s) => s.purchaseOrders);
  const { vendors } = useAppSelector((s) => s.vendors);
  const { items: inventoryItems } = useAppSelector((s) => s.inventory);

  const activeVendors = useMemo(() => vendors.filter((v) => v.status === 'active'), [vendors]);
  const [filter, setFilter] = useState<PurchaseOrderStatus | 'all'>('all');

  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([blankItem()]);
  const [notes, setNotes] = useState('');
  const [relatedJobCardId, setRelatedJobCardId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchVendors());
    dispatch(fetchInventory());
  }, [dispatch]);

  // Open the modal pre-filled from another page (Inventory low-stock or Job Card "Order parts").
  useEffect(() => {
    const prefillInventoryId = searchParams.get('prefillInventoryId');
    const prefillJobId = searchParams.get('prefillJobId');
    if (!prefillInventoryId && !prefillJobId) return;
    // Wait for inventory + vendors to be in store before opening, so the dropdowns aren't empty.
    if (prefillInventoryId && inventoryItems.length === 0) return;
    if (activeVendors.length === 0) return;

    setVendorId(activeVendors[0]?.id ?? '');
    setRelatedJobCardId(prefillJobId ?? undefined);
    setNotes('');
    if (prefillInventoryId) {
      const inv = inventoryItems.find((i) => i.id === prefillInventoryId);
      if (inv) {
        const reorderNeeded = Math.max(inv.reorderLevel - inv.quantity, 1);
        setItems([{
          id: genId(),
          inventoryItemId: inv.id,
          name: inv.name,
          partNumber: inv.partNumber,
          quantity: reorderNeeded,
          notes: '',
        }]);
      } else {
        setItems([blankItem()]);
      }
    } else {
      setItems([blankItem()]);
    }
    createModal.open();
    // Clean the query string so re-renders don't re-open the modal.
    router.replace('/admin/purchase-orders');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, inventoryItems.length, activeVendors.length]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const openCreate = () => {
    setVendorId(activeVendors[0]?.id ?? '');
    setItems([blankItem()]);
    setNotes('');
    setRelatedJobCardId(undefined);
    createModal.open();
  };

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const addItem = () => setItems((prev) => [...prev, blankItem()]);

  const pickFromInventory = (idx: number, inventoryItemId: string) => {
    if (!inventoryItemId) {
      updateItem(idx, { inventoryItemId: undefined });
      return;
    }
    const inv = inventoryItems.find((i) => i.id === inventoryItemId);
    if (!inv) return;
    const reorderNeeded = Math.max(inv.reorderLevel - inv.quantity, 1);
    updateItem(idx, {
      inventoryItemId: inv.id,
      name: inv.name,
      partNumber: inv.partNumber,
      quantity: reorderNeeded,
    });
  };

  const submitPO = async (send: boolean) => {
    if (!vendorId) return toast.error('Pick a vendor', 'A vendor is required');
    const cleaned = items
      .map((i) => ({ ...i, name: i.name.trim(), partNumber: i.partNumber.trim(), notes: i.notes.trim() }))
      .filter((i) => i.name);
    if (cleaned.length === 0) return toast.error('No items', 'Add at least one item');

    setSubmitting(true);
    try {
      await dispatch(createPurchaseOrderThunk({
        vendorId,
        items: cleaned.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          name: i.name,
          partNumber: i.partNumber || undefined,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        notes: notes.trim() || undefined,
        relatedJobCardId,
        send,
      })).unwrap();
      toast.success(send ? 'Purchase order sent' : 'Draft saved', `${cleaned.length} item${cleaned.length !== 1 ? 's' : ''}`);
      createModal.close();
      // Refresh — list update happens via the slice already, this is a safety net.
      dispatch(fetchPurchaseOrders());
    } catch (err) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Purchase Orders</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Send part requests to vendors and track them through to delivery.
          </p>
        </motion.div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} disabled={activeVendors.length === 0}>
          New Purchase Order
        </Button>
      </div>

      {activeVendors.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--text-tertiary)]">
            You need at least one active vendor before raising a purchase order.{' '}
            <button type="button" onClick={() => router.push('/admin/vendors')} className="text-red-500 hover:text-red-400 cursor-pointer">
              Add a vendor →
            </button>
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === s
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
            }`}
          >
            {s === 'all' ? 'All' : statusConfig[s as PurchaseOrderStatus].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <ShoppingCart className="w-10 h-10 text-[var(--text-tertiary)]/50 mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] text-sm">
              {orders.length === 0 ? 'No purchase orders yet.' : 'Nothing in this status.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((po: PurchaseOrder, idx) => {
            const sc = statusConfig[po.status];
            const totalItems = po.items.reduce((sum, it) => sum + it.quantity, 0);
            const totalValue = po.items.reduce((sum, it) => sum + (it.unitPrice ?? 0) * it.quantity, 0);
            return (
              <motion.div
                key={po.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => router.push(`/admin/purchase-orders/${po.id}`)}
                className="glass rounded-2xl p-5 hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">{po.vendorName}</h3>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {po.items.length} line{po.items.length !== 1 ? 's' : ''} · {totalItems} unit{totalItems !== 1 ? 's' : ''}
                        {po.relatedJobCardId && ` · linked to job #${po.relatedJobCardId.slice(-6)}`}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                        #{po.id.slice(-6)} · {po.createdAt ? formatDate(po.createdAt) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {totalValue > 0 ? (
                      <p className="text-sm font-semibold text-[var(--text-primary)]">₹ {totalValue.toLocaleString('en-IN')}</p>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)]">Quote pending</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="New Purchase Order" size="lg">
        <div className="space-y-5">
          {relatedJobCardId && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-300">
              Linked to job <span className="font-mono font-semibold">#{relatedJobCardId.slice(-6)}</span>
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              {activeVendors.length === 0 && <option value="">No active vendors</option>}
              {activeVendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Items</label>
              <button type="button" onClick={addItem} className="text-xs text-red-500 hover:text-red-400 inline-flex items-center gap-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>
            {items.map((it, idx) => (
              <div key={it.id} className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">From inventory</label>
                      <select
                        value={it.inventoryItemId ?? ''}
                        onChange={(e) => pickFromInventory(idx, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      >
                        <option value="">— Custom item —</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.partNumber}) · stock {inv.quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      id={`po-item-name-${it.id}`}
                      label="Name"
                      value={it.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value, inventoryItemId: undefined })}
                      placeholder="Brake pad set"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="mt-6 p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    id={`po-item-pn-${it.id}`}
                    label="Part #"
                    value={it.partNumber}
                    onChange={(e) => updateItem(idx, { partNumber: e.target.value })}
                    placeholder="optional"
                  />
                  <Input
                    id={`po-item-qty-${it.id}`}
                    type="number"
                    label="Quantity"
                    value={String(it.quantity)}
                    onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <Input
                    id={`po-item-notes-${it.id}`}
                    label="Notes"
                    value={it.notes}
                    onChange={(e) => updateItem(idx, { notes: e.target.value })}
                    placeholder="optional"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Notes for vendor (optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={createModal.close} className="flex-1">Cancel</Button>
            <Button type="button" variant="secondary" onClick={() => submitPO(false)} isLoading={submitting} icon={<FileText className="h-4 w-4" />} className="flex-1">Save Draft</Button>
            <Button type="button" onClick={() => submitPO(true)} isLoading={submitting} icon={<Send className="h-4 w-4" />} className="flex-1">Send to Vendor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
