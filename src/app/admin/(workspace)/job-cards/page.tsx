'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, ChevronDown,
  ClipboardList, Wrench, DollarSign, Package, Users, Car,
  Send, CheckCircle, XCircle, Clock, UserCog,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addJobCard, updateJobCard, updateJobCardStatus, deleteJobCard,
  setStatusFilter, setSearchQuery, setCurrentPage,
} from '@/features/jobCards/jobCardSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { formatDate, formatCurrency } from '@/utils/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import ViewToggle from '@/components/ui/ViewToggle';
import { SkeletonHeader, SkeletonCardGrid, SkeletonTable } from '@/components/ui/Skeleton';
import type { JobCard, JobCardStatus, ServiceItem, PartItem, Vehicle, QuoteStatus, Assignment, VehiclePhoto } from '@/types';
import { GST_RATE } from '@/types';
import SendQuoteModal from '@/components/job-cards/SendQuoteModal';
import VehiclePhotoCapture from '@/components/job-cards/VehiclePhotoCapture';
import NotificationTimeline from '@/components/job-cards/NotificationTimeline';
import { simulateSendJobCreatedNotification, simulateSendStatusNotification } from '@/services/notificationService';

const statusConfig: Record<JobCardStatus, { variant: 'warning' | 'info' | 'purple' | 'success'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'purple', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
};

const quoteStatusConfig: Record<QuoteStatus, { icon: typeof CheckCircle; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Quote Pending', className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  sent: { icon: Send, label: 'Quote Sent', className: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  accepted: { icon: CheckCircle, label: 'Quote Accepted', className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { icon: XCircle, label: 'Quote Rejected', className: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

const jobCardSchema = z.object({
  customerName: z.string().min(1, 'Customer is required'),
  vehicleName: z.string().min(1, 'Vehicle is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  notes: z.string().optional(),
});

type JobCardFormData = z.infer<typeof jobCardSchema>;

const defaultAssignees: Assignment[] = [
  { name: '', role: 'Service Advisor' },
  { name: '', role: 'Primary Technician' },
];

export default function JobCardsPage() {
  const dispatch = useAppDispatch();
  const { jobCards, statusFilter, searchQuery, currentPage, pageSize, isLoading } = useAppSelector((state) => state.jobCards);
  const { customers } = useAppSelector((state) => state.customers);
  const availableServices = useAppSelector((state) => state.services.services);
  const inventoryItems = useAppSelector((state) => state.inventory.items);

  // Derive available parts from inventory items
  const availableParts: PartItem[] = useMemo(() =>
    inventoryItems.filter((item) => item.quantity > 0).map((item) => ({
      id: item.id,
      name: item.name,
      partNumber: item.partNumber,
      quantity: 1,
      unitCost: item.unitCost,
      totalCost: item.unitCost,
    })),
    [inventoryItems]
  );
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const toast = useToast();
  const debouncedSearch = useDebounce(localSearch);
  const createModal = useModal();
  const detailModal = useModal();
  const estimateModal = useModal();
  const sendQuoteModal = useModal();
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const viewingJob = useMemo(
    () => (viewingJobId ? jobCards.find((j) => j.id === viewingJobId) ?? null : null),
    [jobCards, viewingJobId]
  );
  const [sendingJob, setSendingJob] = useState<JobCard | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [selectedParts, setSelectedParts] = useState<PartItem[]>([]);
  const [assignees, setAssignees] = useState<Assignment[]>(defaultAssignees);
  const [issues, setIssues] = useState<string[]>(['']);
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);

  const form = useForm<JobCardFormData>({ resolver: zodResolver(jobCardSchema) });

  // Customer & vehicle selection state
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCustomerSuggestions = useMemo(() => {
    if (!customerQuery.trim()) return customers;
    const q = customerQuery.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, customerQuery]);

  const handleSelectCustomer = useCallback((customer: typeof customers[0]) => {
    setSelectedCustomerId(customer.id);
    setCustomerQuery(customer.name);
    form.setValue('customerName', customer.name);
    setShowCustomerDropdown(false);

    const vehicles = customer.vehicles;
    setCustomerVehicles(vehicles);

    if (vehicles.length === 1) {
      const v = vehicles[0];
      setSelectedVehicleId(v.id);
      form.setValue('vehicleName', `${v.make} ${v.model} (${v.year})`);
      form.setValue('licensePlate', v.licensePlate);
    } else {
      setSelectedVehicleId(null);
      form.setValue('vehicleName', '');
      form.setValue('licensePlate', '');
    }
  }, [form]);

  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    form.setValue('vehicleName', `${vehicle.make} ${vehicle.model} (${vehicle.year})`, { shouldValidate: true });
    form.setValue('licensePlate', vehicle.licensePlate, { shouldValidate: true });
  }, [form]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    let result = jobCards;
    if (statusFilter !== 'all') {
      result = result.filter((j) => j.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.customerName.toLowerCase().includes(q) ||
          j.vehicleName.toLowerCase().includes(q) ||
          j.licensePlate.toLowerCase().includes(q) ||
          j.id.includes(q)
      );
    }
    return result;
  }, [jobCards, statusFilter, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedJobs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreate = () => {
    setEditingJob(null);
    setSelectedServices([]);
    setSelectedParts([]);
    setCustomerQuery('');
    setSelectedCustomerId(null);
    setCustomerVehicles([]);
    setSelectedVehicleId(null);
    setAssignees(defaultAssignees);
    setIssues(['']);
    setPhotos([]);
    form.reset({ customerName: '', vehicleName: '', licensePlate: '', notes: '' });
    createModal.open();
  };

  const handleEdit = (job: JobCard) => {
    setEditingJob(job);
    setSelectedServices(job.services);
    setSelectedParts(job.parts);
    setCustomerQuery(job.customerName);
    setSelectedCustomerId(job.customerId);
    const cust = customers.find((c) => c.id === job.customerId);
    setCustomerVehicles(cust?.vehicles || []);
    setSelectedVehicleId(job.vehicleId || null);
    setAssignees(job.assignees.length ? job.assignees : defaultAssignees);
    setIssues(job.issues.length ? job.issues : ['']);
    setPhotos(job.photos ?? []);
    form.reset({
      customerName: job.customerName,
      vehicleName: job.vehicleName,
      licensePlate: job.licensePlate,
      notes: job.notes,
    });
    createModal.open();
  };

  const updateIssue = (index: number, value: string) => {
    setIssues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const addIssueRow = () => {
    setIssues((prev) => [...prev, '']);
  };

  const removeIssueRow = (index: number) => {
    setIssues((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAssignee = (index: number, field: keyof Assignment, value: string) => {
    setAssignees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const addAssigneeRow = () => {
    setAssignees((prev) => [...prev, { name: '', role: '' }]);
  };

  const removeAssigneeRow = (index: number) => {
    setAssignees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleView = (job: JobCard) => {
    setViewingJobId(job.id);
    detailModal.open();
  };

  const handleEstimate = (job: JobCard) => {
    setViewingJobId(job.id);
    setSelectedServices(job.services);
    setSelectedParts(job.parts);
    estimateModal.open();
  };

  const handleSendQuote = (job: JobCard) => {
    setSendingJob(job);
    sendQuoteModal.open();
  };

  const handleSubmit = async (data: JobCardFormData) => {
    const servicesCost = selectedServices.reduce((sum, s) => sum + s.cost, 0);
    const partsCost = selectedParts.reduce((sum, p) => sum + p.totalCost, 0);

    const cleanedAssignees = assignees.filter((a) => a.name.trim() && a.role.trim());
    const cleanedIssues = issues.map((i) => i.trim()).filter(Boolean);

    if (cleanedIssues.length === 0) {
      toast.warning('Issues Required', 'Please add at least one issue point');
      return;
    }

    if (editingJob) {
      dispatch(updateJobCard({
        ...editingJob,
        ...data,
        issues: cleanedIssues,
        assignees: cleanedAssignees,
        notes: data.notes || '',
        services: selectedServices,
        parts: selectedParts,
        estimatedCost: servicesCost + partsCost,
        photos,
        updatedAt: new Date().toISOString(),
      }));
      toast.success('Job Card Updated', `${data.vehicleName} job updated successfully`);
    } else {
      if (!selectedCustomerId) {
        toast.warning('Customer Required', 'Please select a customer from the dropdown');
        return;
      }
      if (!selectedVehicleId) {
        toast.warning('Vehicle Required', 'Please select a vehicle for this job');
        return;
      }
      const newJobInput: Partial<JobCard> = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        customerName: data.customerName,
        vehicleName: data.vehicleName,
        licensePlate: data.licensePlate,
        issues: cleanedIssues,
        assignees: cleanedAssignees,
        notes: data.notes || '',
        photos,
        status: 'pending',
        services: selectedServices,
        parts: selectedParts,
        estimatedCost: servicesCost + partsCost,
        actualCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await dispatch(addJobCard(newJobInput));
      if (addJobCard.fulfilled.match(result)) {
        toast.success('Job Card Created', `New job for ${data.vehicleName} created`);
        simulateSendJobCreatedNotification(dispatch, result.payload);
        toast.info('Customer Notified', `WhatsApp & Email sent to ${data.customerName}`);
      } else {
        toast.error('Could not create job', 'Please try again');
      }
    }
    createModal.close();
  };

  const toggleService = (service: ServiceItem) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id) ? prev.filter((s) => s.id !== service.id) : [...prev, service]
    );
  };

  const togglePart = (part: PartItem) => {
    setSelectedParts((prev) =>
      prev.find((p) => p.id === part.id) ? prev.filter((p) => p.id !== part.id) : [...prev, part]
    );
  };

  const estimatedTotal = selectedServices.reduce((s, srv) => s + srv.cost, 0) + selectedParts.reduce((s, p) => s + p.totalCost, 0);

  if (isLoading && jobCards.length === 0) {
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Jobs</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{filtered.length} jobs</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>New Job</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={localSearch}
            onChange={(e) => { setLocalSearch(e.target.value); dispatch(setSearchQuery(e.target.value)); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all backdrop-blur-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => dispatch(setStatusFilter(status))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {paginatedJobs.map((job, idx) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass rounded-2xl p-5 hover:bg-[var(--bg-glass-hover)] transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)]">{job.vehicleName}</h3>
                      <Badge variant={statusConfig[job.status].variant}>{statusConfig[job.status].label}</Badge>
                      {job.quoteStatus && (() => { const qc = quoteStatusConfig[job.quoteStatus]; const QIcon = qc.icon; return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${qc.className}`}>
                          <QIcon className="w-3 h-3" />{qc.label}
                        </span>
                      ); })()}
                      {job.quoteType && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                          job.quoteType === 'with_gst'
                            ? 'text-red-500 bg-red-500/10 border-red-500/20'
                            : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {job.quoteType === 'with_gst' ? 'GST' : 'Proforma'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{job.customerName} &middot; {job.licensePlate}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-1">{job.issues.join(' • ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-4 hidden lg:block">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(job.estimatedCost)}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{formatDate(job.createdAt)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleView(job)} title="View Details" icon={<Eye className="h-3.5 w-3.5" />} />
                  <Button variant="ghost" size="sm" onClick={() => handleEstimate(job)} title="Estimate" icon={<DollarSign className="h-3.5 w-3.5" />} />
                  {job.estimatedCost > 0 && !job.quoteStatus && (
                    <Button variant="ghost" size="sm" onClick={() => handleSendQuote(job)} title="Send Quote" icon={<Send className="h-3.5 w-3.5 text-blue-500" />} />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(job)} title="Edit" icon={<Edit2 className="h-3.5 w-3.5" />} />
                  <select value={job.status} onChange={(e) => { const newStatus = e.target.value as JobCardStatus; dispatch(updateJobCardStatus({ id: job.id, status: newStatus })); toast.info('Status Updated', `Job status changed to ${newStatus.replace('_', ' ')}`); simulateSendStatusNotification(dispatch, job, newStatus); toast.info('Customer Notified', `Status update sent to ${job.customerName}`); }} className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none">
                    <option value="pending">Pending</option><option value="approved">Approved</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => { dispatch(deleteJobCard(job.id)); toast.error('Job Deleted', `${job.vehicleName} job has been removed`); }} title="Delete" icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedJobs.map((job, idx) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={statusConfig[job.status].variant}>{statusConfig[job.status].label}</Badge>
                    {job.quoteStatus && (() => { const qc = quoteStatusConfig[job.quoteStatus]; const QIcon = qc.icon; return (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold ${qc.className}`}>
                        <QIcon className="w-2.5 h-2.5" />{qc.label}
                      </span>
                    ); })()}
                    {job.quoteType && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-semibold ${
                        job.quoteType === 'with_gst'
                          ? 'text-red-500 bg-red-500/10 border-red-500/20'
                          : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {job.quoteType === 'with_gst' ? 'GST' : 'Proforma'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">{formatDate(job.createdAt)}</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">{job.vehicleName}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{job.customerName}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{job.licensePlate}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-2 line-clamp-2">{job.issues.join(' • ')}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]">
                  <p className="text-sm font-bold gradient-text">{formatCurrency(job.estimatedCost)}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleView(job)} title="View Details" icon={<Eye className="h-3.5 w-3.5" />} />
                    {job.estimatedCost > 0 && !job.quoteStatus && (
                      <Button variant="ghost" size="sm" onClick={() => handleSendQuote(job)} title="Send Quote" icon={<Send className="h-3.5 w-3.5 text-blue-500" />} />
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(job)} title="Edit" icon={<Edit2 className="h-3.5 w-3.5" />} />
                    <Button variant="ghost" size="sm" onClick={() => { dispatch(deleteJobCard(job.id)); toast.error('Job Deleted', `${job.vehicleName} job has been removed`); }} title="Delete" icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No jobs found</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => dispatch(setCurrentPage(p))} />

      {/* Create/Edit Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title={editingJob ? 'Edit Job' : 'New Job'} size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {/* Customer Selection */}
          <div ref={customerDropdownRef} className="relative">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Customer</span>
            </label>
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setShowCustomerDropdown(true);
                if (!e.target.value.trim()) {
                  setSelectedCustomerId(null);
                  setCustomerVehicles([]);
                  setSelectedVehicleId(null);
                  form.setValue('customerName', '');
                  form.setValue('vehicleName', '');
                  form.setValue('licensePlate', '');
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Search customer by name, phone, or email..."
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 hover:border-[var(--text-tertiary)]"
            />
            <input type="hidden" {...form.register('customerName')} />
            {form.formState.errors.customerName && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.customerName.message}</p>
            )}

            {showCustomerDropdown && filteredCustomerSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl glass-strong border border-[var(--border-color)] shadow-xl">
                {filteredCustomerSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--bg-tertiary)] transition-colors ${
                      selectedCustomerId === customer.id ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-red-500">{customer.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{customer.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{customer.phone} &middot; {customer.vehicles.length} vehicle{customer.vehicles.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> Vehicle</span>
            </label>
            {customerVehicles.length > 1 ? (
              <>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">This customer has {customerVehicles.length} vehicles. Select one to proceed.</p>
                <div className="space-y-2">
                  {customerVehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVehicle(v)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                          isSelected
                            ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                            : 'bg-[var(--bg-tertiary)] border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Car className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-red-500' : ''}`} />
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{v.make} {v.model} <span className="text-[var(--text-tertiary)]">({v.year})</span></p>
                            <p className="text-xs text-[var(--text-tertiary)]">{v.color} &middot; {(v.mileage ?? 0).toLocaleString()} km</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-tertiary)]">{v.licensePlate}</span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : customerVehicles.length === 1 ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm">
                <Car className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{customerVehicles[0].make} {customerVehicles[0].model} ({customerVehicles[0].year})</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{customerVehicles[0].licensePlate} &middot; {customerVehicles[0].color}</p>
                </div>
                <span className="ml-auto text-[10px] text-emerald-400 font-medium">Auto-selected</span>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] p-3 rounded-xl bg-[var(--bg-tertiary)]">
                {selectedCustomerId ? 'No vehicles linked to this customer' : 'Select a customer first'}
              </p>
            )}
            <input type="hidden" {...form.register('vehicleName')} />
            <input type="hidden" {...form.register('licensePlate')} />
            {form.formState.errors.vehicleName && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.vehicleName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> Assigned To</span>
              </label>
              <button
                type="button"
                onClick={addAssigneeRow}
                title="Add another assignee"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {assignees.map((a, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      id={`assignee-name-${idx}`}
                      placeholder="Name"
                      value={a.name}
                      onChange={(e) => updateAssignee(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id={`assignee-role-${idx}`}
                      placeholder="Role"
                      value={a.role}
                      onChange={(e) => updateAssignee(idx, 'role', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAssigneeRow(idx)}
                    disabled={assignees.length === 1}
                    title="Remove row"
                    className="flex-shrink-0 mt-1 p-2.5 rounded-xl text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Issues</span>
              </label>
              <button
                type="button"
                onClick={addIssueRow}
                title="Add another issue"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-3 text-xs font-semibold text-[var(--text-tertiary)] w-5 text-right">{idx + 1}.</span>
                  <div className="flex-1">
                    <Input
                      id={`issue-${idx}`}
                      placeholder="Describe one issue..."
                      value={issue}
                      onChange={(e) => updateIssue(idx, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIssueRow(idx)}
                    disabled={issues.length === 1}
                    title="Remove row"
                    className="flex-shrink-0 mt-1 p-2.5 rounded-xl text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Textarea {...form.register('notes')} id="notes" label="Notes" placeholder="Additional notes..." rows={2} />

          <VehiclePhotoCapture photos={photos} onChange={setPhotos} />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Wrench className="h-4 w-4" /> Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                    selectedServices.find((s) => s.id === service.id)
                      ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                      : 'bg-[var(--bg-tertiary)] border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                  }`}
                >
                  <span>{service.name}</span>
                  <span className="font-semibold">{formatCurrency(service.cost)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Package className="h-4 w-4" /> Parts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableParts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => togglePart(part)}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                    selectedParts.find((p) => p.id === part.id)
                      ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                      : 'bg-[var(--bg-tertiary)] border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                  }`}
                >
                  <span>{part.name}</span>
                  <span className="font-semibold">{formatCurrency(part.totalCost)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Estimated Total</span>
              <span className="text-xl font-bold gradient-text">{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={createModal.close} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingJob ? 'Update' : 'Create'} Job</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.close} title="Job Details" size="lg">
        {viewingJob && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">Customer</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{viewingJob.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">Vehicle</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{viewingJob.vehicleName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">License Plate</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{viewingJob.licensePlate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">Status</p>
                <Badge variant={statusConfig[viewingJob.status].variant}>{statusConfig[viewingJob.status].label}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">Assigned To</p>
                {viewingJob.assignees.length > 0 ? (
                  <div className="space-y-0.5">
                    {viewingJob.assignees.map((a, idx) => (
                      <p key={idx} className="text-sm font-medium text-[var(--text-primary)]">
                        {a.name} <span className="text-xs text-[var(--text-tertiary)] font-normal">— {a.role}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[var(--text-primary)]">Unassigned</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-tertiary)]">Created</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(viewingJob.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-tertiary)]">Issues</p>
              <ul className="p-3 rounded-xl bg-[var(--bg-tertiary)] space-y-1.5 list-disc list-inside text-sm text-[var(--text-primary)]">
                {viewingJob.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
            {viewingJob.photos && viewingJob.photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-tertiary)]">Vehicle Photos ({viewingJob.photos.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewingJob.photos.map((photo) => (
                    <a key={photo.id} href={photo.dataUrl} target="_blank" rel="noreferrer" className="relative rounded-xl overflow-hidden border border-[var(--border-color)] block aspect-square group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.dataUrl} alt="vehicle" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                        <p className="text-[10px] text-white/90">{new Date(photo.capturedAt).toLocaleString()}</p>
                        {photo.locationLabel && <p className="text-[10px] text-white/80">{photo.locationLabel}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const customerChose = viewingJob.quoteStatus === 'accepted' && (viewingJob.approvedServiceIds || viewingJob.approvedPartIds);
              const approvedSvcSet = new Set(viewingJob.approvedServiceIds ?? viewingJob.services.map((s) => s.id));
              const approvedPartSet = new Set(viewingJob.approvedPartIds ?? viewingJob.parts.map((p) => p.id));
              const approvedSvcCount = viewingJob.services.filter((s) => approvedSvcSet.has(s.id)).length;
              const approvedPartCount = viewingJob.parts.filter((p) => approvedPartSet.has(p.id)).length;
              return (
                <>
                  {viewingJob.services.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[var(--text-tertiary)]">Services</p>
                        {customerChose && (
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            <span className="text-emerald-500 font-semibold">{approvedSvcCount}</span> of {viewingJob.services.length} approved by customer
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {viewingJob.services.map((s) => {
                          const approved = approvedSvcSet.has(s.id);
                          return (
                            <div key={s.id} className={`flex items-center gap-2 justify-between p-2.5 rounded-lg text-sm ${customerChose && !approved ? 'bg-red-500/5 border border-red-500/15' : 'bg-[var(--bg-tertiary)]'}`}>
                              {customerChose && (
                                approved
                                  ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                  : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              <span className={`flex-1 ${customerChose && !approved ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>{s.name}</span>
                              {customerChose && !approved && (
                                <span className="text-[10px] uppercase tracking-wide text-red-400 font-semibold">Declined</span>
                              )}
                              <span className={`font-medium ${customerChose && !approved ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)]'}`}>{formatCurrency(s.cost)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {viewingJob.parts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[var(--text-tertiary)]">Parts</p>
                        {customerChose && (
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            <span className="text-emerald-500 font-semibold">{approvedPartCount}</span> of {viewingJob.parts.length} approved by customer
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {viewingJob.parts.map((p) => {
                          const approved = approvedPartSet.has(p.id);
                          return (
                            <div key={p.id} className={`flex items-center gap-2 justify-between p-2.5 rounded-lg text-sm ${customerChose && !approved ? 'bg-red-500/5 border border-red-500/15' : 'bg-[var(--bg-tertiary)]'}`}>
                              {customerChose && (
                                approved
                                  ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                  : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              <span className={`flex-1 ${customerChose && !approved ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>{p.name} x{p.quantity}</span>
                              {customerChose && !approved && (
                                <span className="text-[10px] uppercase tracking-wide text-red-400 font-semibold">Declined</span>
                              )}
                              <span className={`font-medium ${customerChose && !approved ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)]'}`}>{formatCurrency(p.totalCost)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 space-y-2.5">
              {viewingJob.quoteType && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Quote Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    viewingJob.quoteType === 'with_gst'
                      ? 'text-red-500 bg-red-500/10 border-red-500/20'
                      : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {viewingJob.quoteType === 'with_gst' ? `With GST (${GST_RATE}%)` : 'Proforma · No GST'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{formatCurrency(viewingJob.quoteSubtotal ?? viewingJob.estimatedCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>GST ({GST_RATE}%)</span>
                <span>
                  {viewingJob.quoteType === 'with_gst'
                    ? formatCurrency(viewingJob.quoteTaxAmount ?? 0)
                    : <span className="text-amber-500 text-[11px] uppercase tracking-wide font-semibold">N/A</span>}
                </span>
              </div>
              <div className="pt-2 border-t border-red-500/20 flex justify-between items-center">
                <span className="font-medium text-[var(--text-secondary)]">
                  {viewingJob.quoteStatus === 'accepted' ? 'Customer-Approved Total' : 'Estimated Total'}
                </span>
                <span className="text-xl font-bold gradient-text">
                  {formatCurrency(viewingJob.quoteTotal ?? viewingJob.estimatedCost)}
                </span>
              </div>
            </div>

            {/* Quote & Notification History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Quote & Notifications</p>
                {viewingJob.estimatedCost > 0 && !viewingJob.quoteStatus && (
                  <Button size="sm" onClick={() => { detailModal.close(); handleSendQuote(viewingJob); }} icon={<Send className="h-3.5 w-3.5" />}>Send Quote</Button>
                )}
              </div>
              {viewingJob.quoteStatus && (() => { const qc = quoteStatusConfig[viewingJob.quoteStatus]; const QIcon = qc.icon; return (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold mb-3 ${qc.className}`}>
                  <QIcon className="w-3.5 h-3.5" />{qc.label}
                </div>
              ); })()}
              <NotificationTimeline jobCardId={viewingJob.id} />
            </div>
          </div>
        )}
      </Modal>

      {/* Estimation Modal */}
      <Modal isOpen={estimateModal.isOpen} onClose={estimateModal.close} title="Inspection & Estimation" size="lg">
        {viewingJob && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <p className="text-sm text-[var(--text-primary)] font-medium">{viewingJob.vehicleName}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{viewingJob.customerName} &middot; {viewingJob.licensePlate}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Select Services</h3>
              <div className="space-y-2">
                {availableServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                      selectedServices.find((s) => s.id === service.id)
                        ? 'bg-red-500/15 border border-red-500/30'
                        : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)]'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{service.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{service.description} &middot; {service.laborHours}h</p>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(service.cost)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Select Parts</h3>
              <div className="space-y-2">
                {availableParts.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => togglePart(part)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                      selectedParts.find((p) => p.id === part.id)
                        ? 'bg-red-500/15 border border-red-500/30'
                        : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)]'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{part.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Part# {part.partNumber} &middot; Qty: {part.quantity}</p>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(part.totalCost)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl glass border border-[var(--border-glass)] space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cost Breakdown</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Services ({selectedServices.length})</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedServices.reduce((s, srv) => s + srv.cost, 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Parts ({selectedParts.length})</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedParts.reduce((s, p) => s + p.totalCost, 0))}</span>
              </div>
              <div className="border-t border-[var(--border-color)] pt-3 flex justify-between">
                <span className="font-semibold text-[var(--text-primary)]">Estimated Total</span>
                <span className="text-xl font-bold gradient-text">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (viewingJob) {
                  dispatch(updateJobCard({
                    ...viewingJob,
                    services: selectedServices,
                    parts: selectedParts,
                    estimatedCost: estimatedTotal,
                    updatedAt: new Date().toISOString(),
                  }));
                  toast.success('Estimation Saved', `Estimate updated for ${viewingJob.vehicleName}`);
                }
                estimateModal.close();
              }}
            >
              Save Estimation
            </Button>
          </div>
        )}
      </Modal>

      {/* Send Quote Modal */}
      {sendingJob && (
        <SendQuoteModal
          isOpen={sendQuoteModal.isOpen}
          onClose={() => { sendQuoteModal.close(); setSendingJob(null); }}
          jobCard={sendingJob}
        />
      )}
    </div>
  );
}
