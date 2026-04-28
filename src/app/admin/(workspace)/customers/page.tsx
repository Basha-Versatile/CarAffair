'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Edit2, Trash2, Car, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import ViewToggle from '@/components/ui/ViewToggle';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addCustomer, updateCustomer, deleteCustomer, addVehicle } from '@/features/customers/customerSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { generateId, formatDate } from '@/utils/format';
import { lookupVehicleByRegistration, SurepassLookupError } from '@/services/surepassService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import Pagination from '@/components/ui/Pagination';
import { SkeletonHeader, SkeletonCardGrid, SkeletonTable } from '@/components/ui/Skeleton';
import type { Customer } from '@/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
});

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1990).max(2030),
  color: z.string().min(1, 'Color is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().min(1, 'VIN is required'),
  mileage: z.number().min(0),
  engineNumber: z.string().min(1, 'Engine number is required'),
  chassisNumber: z.string().min(1, 'Chassis number is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const { customers, isLoading } = useAppSelector((state) => state.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const customerModal = useModal();
  const vehicleModal = useModal();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [vehicleCustomerId, setVehicleCustomerId] = useState('');
  const [lookupPlate, setLookupPlate] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.vehicles.some((v) => v.licensePlate.toLowerCase().includes(q))
    );
  }, [customers, debouncedSearch]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const customerForm = useForm<CustomerFormData>({ resolver: zodResolver(customerSchema) });
  const vehicleForm = useForm<VehicleFormData>({ resolver: zodResolver(vehicleSchema) });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    customerForm.reset({ name: '', email: '', phone: '', address: '' });
    customerModal.open();
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    customerForm.reset({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address });
    customerModal.open();
  };

  const handleCustomerSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      dispatch(updateCustomer({ ...editingCustomer, ...data }));
      toast.success('Customer Updated', `${data.name} has been updated successfully`);
    } else {
      dispatch(addCustomer({ id: generateId(), ...data, vehicles: [], createdAt: new Date().toISOString() }));
      toast.success('Customer Added', `${data.name} has been added successfully`);
    }
    customerModal.close();
  };

  const handleAddVehicle = (customerId: string) => {
    setVehicleCustomerId(customerId);
    vehicleForm.reset({ make: '', model: '', year: 2024, color: '', licensePlate: '', vin: '', mileage: 0, engineNumber: '', chassisNumber: '' });
    setLookupPlate('');
    setLookupError(null);
    setIsLookingUp(false);
    vehicleModal.open();
  };

  const handleLookupVehicle = async () => {
    const plate = lookupPlate.trim().toUpperCase();
    if (!plate) {
      setLookupError('Enter a registration number');
      return;
    }
    setLookupError(null);
    setIsLookingUp(true);
    try {
      const data = await lookupVehicleByRegistration(plate);
      vehicleForm.reset({
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        licensePlate: data.licensePlate,
        vin: data.vin,
        mileage: data.mileage,
        engineNumber: data.engineNumber ?? '',
        chassisNumber: data.chassisNumber ?? '',
      });
      dispatch(addVehicle({ id: generateId(), customerId: vehicleCustomerId, ...data }));
      toast.success('Vehicle Fetched', `${data.make} ${data.model} added from RC lookup`);
      vehicleModal.close();
    } catch (err) {
      const message = err instanceof SurepassLookupError ? err.message : 'Lookup failed. Try again or enter details manually.';
      setLookupError(message);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleVehicleSubmit = (data: VehicleFormData) => {
    dispatch(addVehicle({ id: generateId(), customerId: vehicleCustomerId, ...data }));
    toast.success('Vehicle Added', `${data.make} ${data.model} has been added`);
    vehicleModal.close();
  };

  if (isLoading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        {view === 'grid' ? <SkeletonCardGrid count={6} /> : <SkeletonTable rows={6} columns={6} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customers</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{customers.length} registered customers</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search customers or plates..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all backdrop-blur-sm"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleAddCustomer} icon={<Plus className="h-4 w-4" />}>Add Customer</Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCustomers.map((customer, idx) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card hover onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Since {formatDate(customer.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button title="Edit" onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-500 transition-all cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); dispatch(deleteCustomer(customer.id)); toast.error('Customer Deleted', `${customer.name} has been removed`); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />{customer.email}</div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />{customer.phone}</div>
                  <div className="flex items-center gap-2"><Car className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /><Badge variant="info">{customer.vehicles.length} vehicle{customer.vehicles.length !== 1 ? 's' : ''}</Badge></div>
                </div>
                {expandedCustomer === customer.id && customer.vehicles.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-2">
                    {customer.vehicles.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)] text-sm">
                        <div><span className="text-[var(--text-primary)] font-medium">{v.make} {v.model}</span><span className="text-[var(--text-tertiary)] ml-2">({v.year})</span></div>
                        <Badge variant="default">{v.licensePlate}</Badge>
                      </div>
                    ))}
                  </motion.div>
                )}
                <div className="mt-4">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleAddVehicle(customer.id); }} icon={<Plus className="h-3.5 w-3.5" />}>Add Vehicle</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border-color)]">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Address</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Vehicles</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Since</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedCustomers.map((customer, idx) => (
                <motion.tr key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                  <td className="px-6 py-4"><p className="text-sm font-semibold text-[var(--text-primary)]">{customer.name}</p></td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--text-secondary)]">{customer.email}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{customer.phone}</p>
                  </td>
                  <td className="px-6 py-4"><p className="text-sm text-[var(--text-secondary)] max-w-[200px] truncate">{customer.address}</p></td>
                  <td className="px-6 py-4"><Badge variant="info">{customer.vehicles.length} vehicle{customer.vehicles.length !== 1 ? 's' : ''}</Badge></td>
                  <td className="px-6 py-4"><span className="text-sm text-[var(--text-tertiary)]">{formatDate(customer.createdAt)}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button title="Add Vehicle" onClick={() => handleAddVehicle(customer.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"><Plus className="h-3.5 w-3.5" /></button>
                      <button title="Edit" onClick={() => handleEditCustomer(customer)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-500 transition-all cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button title="Delete" onClick={() => { dispatch(deleteCustomer(customer.id)); toast.error('Customer Deleted', `${customer.name} has been removed`); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-[var(--text-tertiary)]">No customers found</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal isOpen={customerModal.isOpen} onClose={customerModal.close} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
          <Input {...customerForm.register('name')} id="name" label="Full Name" placeholder="Enter full name" error={customerForm.formState.errors.name?.message} />
          <Input {...customerForm.register('email')} id="email" label="Email" type="email" placeholder="Enter email" error={customerForm.formState.errors.email?.message} />
          <Input {...customerForm.register('phone')} id="phone" label="Phone" placeholder="+91 XXXXX XXXXX" error={customerForm.formState.errors.phone?.message} />
          <Input {...customerForm.register('address')} id="address" label="Address" placeholder="Enter address" error={customerForm.formState.errors.address?.message} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={customerModal.close} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingCustomer ? 'Update' : 'Add'} Customer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={vehicleModal.isOpen} onClose={vehicleModal.close} title="Add Vehicle">
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Quick Add by Registration</p>
                <p className="text-xs text-[var(--text-tertiary)]">Auto-fetch vehicle details via Surepass RC lookup</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  id="lookupPlate"
                  placeholder="KA-01-AB-1234"
                  value={lookupPlate}
                  onChange={(e) => { setLookupPlate(e.target.value); setLookupError(null); }}
                  error={lookupError ?? undefined}
                />
              </div>
              <Button type="button" onClick={handleLookupVehicle} isLoading={isLookingUp} disabled={isLookingUp}>
                Fetch
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">or add manually</span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          <form onSubmit={vehicleForm.handleSubmit(handleVehicleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input {...vehicleForm.register('make')} id="make" label="Make" placeholder="e.g. BMW" error={vehicleForm.formState.errors.make?.message} />
              <Input {...vehicleForm.register('model')} id="model" label="Model" placeholder="e.g. 3 Series" error={vehicleForm.formState.errors.model?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input {...vehicleForm.register('year', { valueAsNumber: true })} id="year" label="Year" type="number" error={vehicleForm.formState.errors.year?.message} />
              <Input {...vehicleForm.register('color')} id="color" label="Color" placeholder="e.g. White" error={vehicleForm.formState.errors.color?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input {...vehicleForm.register('licensePlate')} id="licensePlate" label="License Plate" placeholder="KA-01-AB-1234" error={vehicleForm.formState.errors.licensePlate?.message} />
              <Input {...vehicleForm.register('mileage', { valueAsNumber: true })} id="mileage" label="Mileage (km)" type="number" error={vehicleForm.formState.errors.mileage?.message} />
            </div>
            <Input {...vehicleForm.register('vin')} id="vin" label="VIN Number" placeholder="Enter VIN" error={vehicleForm.formState.errors.vin?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Input {...vehicleForm.register('engineNumber')} id="engineNumber" label="Engine Number" placeholder="Enter engine number" error={vehicleForm.formState.errors.engineNumber?.message} />
              <Input {...vehicleForm.register('chassisNumber')} id="chassisNumber" label="Chassis Number" placeholder="Enter chassis number" error={vehicleForm.formState.errors.chassisNumber?.message} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={vehicleModal.close} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Add Vehicle</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
