'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, Plus, Search, Edit2, Trash2, Clock, DollarSign } from 'lucide-react';
import ViewToggle from '@/components/ui/ViewToggle';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addService, updateService, deleteService } from '@/features/services/servicesSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { generateId, formatCurrency } from '@/utils/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import Pagination from '@/components/ui/Pagination';
import type { ServiceItem } from '@/types';

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().min(0, 'Cost must be a positive number'),
  laborHours: z.number().min(0, 'Labor hours must be a positive number'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const { services } = useAppSelector((state) => state.services);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const serviceModal = useModal();
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const filteredServices = useMemo(() => {
    if (!debouncedSearch) return services;
    const q = debouncedSearch.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [services, debouncedSearch]);

  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const paginatedServices = filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const serviceForm = useForm<ServiceFormData>({ resolver: zodResolver(serviceSchema) });

  const handleAddService = () => {
    setEditingService(null);
    serviceForm.reset({ name: '', description: '', cost: 0, laborHours: 0 });
    serviceModal.open();
  };

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service);
    serviceForm.reset({ name: service.name, description: service.description, cost: service.cost, laborHours: service.laborHours });
    serviceModal.open();
  };

  const handleServiceSubmit = (data: ServiceFormData) => {
    if (editingService) {
      dispatch(updateService({ ...editingService, ...data }));
      toast.success('Service Updated', `${data.name} has been updated successfully`);
    } else {
      dispatch(addService({ id: generateId(), ...data }));
      toast.success('Service Added', `${data.name} has been added successfully`);
    }
    serviceModal.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Services</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{services.length} services available</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all backdrop-blur-sm"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleAddService} icon={<Plus className="h-4 w-4" />}>Add Service</Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedServices.map((service, idx) => (
            <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{service.name}</h3>
                      <p className="text-xs text-[var(--text-tertiary)] line-clamp-1">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button title="Edit" onClick={() => handleEditService(service)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-500 transition-all cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button title="Delete" onClick={() => { dispatch(deleteService(service.id)); toast.error('Service Deleted', `${service.name} has been removed`); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]"><DollarSign className="h-3.5 w-3.5" />Cost</div>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(service.cost)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]"><Clock className="h-3.5 w-3.5" />Labor Hours</div>
                    <span className="font-semibold text-[var(--text-primary)]">{service.laborHours} hrs</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[var(--border-color)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Service</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Labor Hours</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {paginatedServices.map((service, idx) => (
                  <motion.tr key={service.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-[var(--text-secondary)] max-w-[300px] truncate">{service.description}</p></td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(service.cost)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                        <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        {service.laborHours} hrs
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Edit" onClick={() => handleEditService(service)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-500 transition-all cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button title="Delete" onClick={() => { dispatch(deleteService(service.id)); toast.error('Service Deleted', `${service.name} has been removed`); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredServices.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Wrench className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No services found</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal isOpen={serviceModal.isOpen} onClose={serviceModal.close} title={editingService ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-4">
          <Input {...serviceForm.register('name')} id="name" label="Service Name" placeholder="e.g. Oil Change" error={serviceForm.formState.errors.name?.message} />
          <Textarea {...serviceForm.register('description')} id="description" label="Description" placeholder="Describe the service..." rows={3} error={serviceForm.formState.errors.description?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input {...serviceForm.register('cost', { valueAsNumber: true })} id="cost" label="Cost" type="number" placeholder="0.00" error={serviceForm.formState.errors.cost?.message} />
            <Input {...serviceForm.register('laborHours', { valueAsNumber: true })} id="laborHours" label="Labor Hours" type="number" placeholder="0" error={serviceForm.formState.errors.laborHours?.message} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={serviceModal.close} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingService ? 'Update' : 'Add'} Service</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
