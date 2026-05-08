'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin, Truck, Archive, ArchiveRestore } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVendors, createVendor, updateVendorThunk, deleteVendorThunk } from '@/features/vendors/vendorsSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useModal } from '@/hooks/useModal';
import { Skeleton, SkeletonHeader } from '@/components/ui/Skeleton';
import type { Vendor } from '@/types';

interface VendorForm {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categoriesText: string;
  notes: string;
}

const empty: VendorForm = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  categoriesText: '',
  notes: '',
};

export default function VendorsPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const formModal = useModal();
  const { vendors, isLoading } = useAppSelector((s) => s.vendors);

  const [form, setForm] = useState<VendorForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const openCreate = () => {
    setForm(empty);
    setEditingId(null);
    formModal.open();
  };

  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name,
      contactPerson: v.contactPerson ?? '',
      phone: v.phone ?? '',
      email: v.email ?? '',
      address: v.address ?? '',
      categoriesText: (v.categories ?? []).join(', '),
      notes: v.notes ?? '',
    });
    setEditingId(v.id);
    formModal.open();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name required', 'Enter the vendor name');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        categories: form.categoriesText
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        notes: form.notes.trim(),
      };
      if (editingId) {
        await dispatch(updateVendorThunk({ id: editingId, ...payload })).unwrap();
        toast.success('Vendor updated', form.name);
      } else {
        await dispatch(createVendor(payload)).unwrap();
        toast.success('Vendor added', form.name);
      }
      formModal.close();
    } catch (err) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async (v: Vendor) => {
    try {
      const next = v.status === 'active' ? 'archived' : 'active';
      await dispatch(updateVendorThunk({ id: v.id, status: next })).unwrap();
      toast.success(`Vendor ${next}`, v.name);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const requestDelete = (v: Vendor) => setPendingDelete(v);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await dispatch(deleteVendorThunk(pendingDelete.id)).unwrap();
      toast.error('Vendor deleted', pendingDelete.name);
      setPendingDelete(null);
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Try again');
      setPendingDelete(null);
    }
  };

  if (isLoading && vendors.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vendors</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} for parts &amp; supplies.
          </p>
        </motion.div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Add Vendor</Button>
      </div>

      {vendors.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Truck className="w-10 h-10 text-[var(--text-tertiary)]/50 mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] text-sm">No vendors yet. Add one to start sending purchase orders.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <Card key={v.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">{v.name}</h3>
                    {v.contactPerson && <p className="text-xs text-[var(--text-tertiary)] truncate">{v.contactPerson}</p>}
                  </div>
                </div>
                <Badge variant={v.status === 'active' ? 'success' : 'default'}>
                  {v.status === 'active' ? 'Active' : 'Archived'}
                </Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                {v.phone && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {v.phone}
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {v.email}
                  </div>
                )}
                {v.address && (
                  <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                    <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)] mt-0.5" />
                    <span className="line-clamp-2">{v.address}</span>
                  </div>
                )}
              </div>
              {v.categories && v.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {v.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 text-[10px] rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{c}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => openEdit(v)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleArchiveToggle(v)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                  title={v.status === 'active' ? 'Archive' : 'Activate'}
                >
                  {v.status === 'active' ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(v)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer ml-auto"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={formModal.isOpen} onClose={formModal.close} title={editingId ? 'Edit Vendor' : 'Add Vendor'}>
        <div className="space-y-4">
          <Input id="vendor-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Apex Spares" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input id="vendor-contact" label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Manager name" />
            <Input id="vendor-phone" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 99999" />
          </div>
          <Input id="vendor-email" type="email" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vendor@example.com" />
          <Input id="vendor-address" label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city" />
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Categories (comma-separated)</label>
            <input
              type="text"
              value={form.categoriesText}
              onChange={(e) => setForm({ ...form, categoriesText: e.target.value })}
              placeholder="brakes, batteries, filters"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={formModal.close} className="flex-1">Cancel</Button>
            <Button type="button" onClick={handleSubmit} isLoading={submitting} className="flex-1">{editingId ? 'Save Changes' : 'Add Vendor'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete vendor"
        message={pendingDelete ? `Delete vendor "${pendingDelete.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete vendor"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
