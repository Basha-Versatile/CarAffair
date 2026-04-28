'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Package, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/features/inventory/inventorySlice';
import { addAlert } from '@/features/notifications/notificationSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { generateId, formatCurrency } from '@/utils/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ViewToggle from '@/components/ui/ViewToggle';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { SkeletonHeader, SkeletonCardGrid, SkeletonTable } from '@/components/ui/Skeleton';
import type { InventoryItem } from '@/types';

const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0, 'Must be 0 or more'),
  unitCost: z.number().min(0, 'Must be 0 or more'),
  reorderLevel: z.number().min(0, 'Must be 0 or more'),
  supplier: z.string().min(1, 'Supplier is required'),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((state) => state.inventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const debouncedSearch = useDebounce(searchQuery);
  const toast = useToast();
  const createModal = useModal();
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const form = useForm<InventoryFormData>({ resolver: zodResolver(inventorySchema) });

  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [debouncedSearch, items]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({ name: '', partNumber: '', category: '', quantity: 0, unitCost: 0, reorderLevel: 5, supplier: '' });
    createModal.open();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset(item);
    createModal.open();
  };

  // Track which items we've already alerted for to avoid duplicates
  const alertedItemsRef = useRef<Set<string>>(new Set());

  // Check for low-stock items on mount and when items change
  useEffect(() => {
    items.forEach((item) => {
      if (item.quantity <= item.reorderLevel && !alertedItemsRef.current.has(item.id)) {
        alertedItemsRef.current.add(item.id);
        dispatch(addAlert({
          id: `alert-${generateId()}`,
          type: 'status_updated',
          title: 'Low Stock Alert',
          message: `${item.name} (${item.partNumber}) has only ${item.quantity} units left — reorder level is ${item.reorderLevel}`,
          customerName: item.supplier,
          vehicleName: item.name,
          read: false,
          createdAt: new Date().toISOString(),
        }));
      }
    });
  }, [items, dispatch]);

  const handleSubmit = (data: InventoryFormData) => {
    if (editingItem) {
      dispatch(updateInventoryItem({ ...editingItem, ...data }));
      toast.success('Item Updated', `${data.name} updated successfully`);
      // Check if updated quantity hits reorder level
      if (data.quantity <= data.reorderLevel) {
        alertedItemsRef.current.delete(editingItem.id); // allow re-alert
        toast.warning('Low Stock', `${data.name} is at or below reorder level (${data.quantity}/${data.reorderLevel})`);
      }
    } else {
      const newId = `inv-${generateId()}`;
      dispatch(addInventoryItem({ id: newId, ...data }));
      toast.success('Item Added', `${data.name} added to inventory`);
      if (data.quantity <= data.reorderLevel) {
        toast.warning('Low Stock', `${data.name} is at or below reorder level`);
      }
    }
    createModal.close();
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        {view === 'grid' ? <SkeletonCardGrid count={6} /> : <SkeletonTable rows={6} columns={5} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{items.length} items in stock</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all backdrop-blur-sm"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleAdd} icon={<Plus className="h-4 w-4" />}>Add Item</Button>
        </div>
      </div>

      {view === 'list' ? (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Item</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Part #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Unit Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedItems.map((item, idx) => {
                const isLow = item.quantity <= item.reorderLevel;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-[var(--bg-glass-hover)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] font-mono">{item.partNumber}</td>
                    <td className="px-6 py-4"><Badge variant="info">{item.category}</Badge></td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">{formatCurrency(item.unitCost)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.supplier}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" /> Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} title="Edit" icon={<Edit2 className="h-3.5 w-3.5" />} />
                        <Button variant="ghost" size="sm" onClick={() => { dispatch(deleteInventoryItem(item.id)); toast.error('Item Deleted', `${item.name} removed from inventory`); }} title="Delete" icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />} />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item, idx) => {
            const isLow = item.quantity <= item.reorderLevel;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h3>
                        <p className="text-xs text-[var(--text-tertiary)] font-mono">{item.partNumber}</p>
                      </div>
                    </div>
                    {isLow ? <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" /> Low</Badge> : <Badge variant="success">In Stock</Badge>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-tertiary)]">Category</span><Badge variant="info">{item.category}</Badge></div>
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-tertiary)]">Stock</span><span className="font-semibold text-[var(--text-primary)]">{item.quantity}</span></div>
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-tertiary)]">Unit Cost</span><span className="text-[var(--text-primary)]">{formatCurrency(item.unitCost)}</span></div>
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-tertiary)]">Supplier</span><span className="text-[var(--text-secondary)]">{item.supplier}</span></div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-[var(--border-color)]">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} title="Edit" icon={<Edit2 className="h-3.5 w-3.5" />} />
                    <Button variant="ghost" size="sm" onClick={() => { dispatch(deleteInventoryItem(item.id)); toast.error('Item Deleted', `${item.name} removed`); }} title="Delete" icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No inventory items found</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Add/Edit Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Input {...form.register('name')} id="name" label="Item Name" placeholder="e.g. Engine Oil (5W-30)" error={form.formState.errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input {...form.register('partNumber')} id="partNumber" label="Part Number" placeholder="e.g. EO-5W30" error={form.formState.errors.partNumber?.message} />
            <Input {...form.register('category')} id="category" label="Category" placeholder="e.g. Fluids" error={form.formState.errors.category?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input {...form.register('quantity', { valueAsNumber: true })} id="quantity" label="Quantity" type="number" error={form.formState.errors.quantity?.message} />
            <Input {...form.register('unitCost', { valueAsNumber: true })} id="unitCost" label="Unit Cost (₹)" type="number" error={form.formState.errors.unitCost?.message} />
            <Input {...form.register('reorderLevel', { valueAsNumber: true })} id="reorderLevel" label="Reorder Level" type="number" error={form.formState.errors.reorderLevel?.message} />
          </div>
          <Input {...form.register('supplier')} id="supplier" label="Supplier" placeholder="e.g. Castrol India" error={form.formState.errors.supplier?.message} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={createModal.close} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingItem ? 'Update Item' : 'Add Item'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
