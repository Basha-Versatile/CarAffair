'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { fetchCustomers } from '@/features/customers/customerSlice';
import { fetchJobCards } from '@/features/jobCards/jobCardSlice';
import { fetchBills } from '@/features/billing/billingSlice';
import { fetchInventory } from '@/features/inventory/inventorySlice';
import { fetchServices } from '@/features/services/servicesSlice';
import { fetchSlots } from '@/features/slots/slotsSlice';
import { fetchAdminAlerts } from '@/features/notifications/notificationSlice';
import { fetchUsers } from '@/features/users/usersSlice';
import { fetchVendors } from '@/features/vendors/vendorsSlice';
import { fetchPurchaseOrders } from '@/features/purchaseOrders/purchaseOrdersSlice';

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const role = useAppSelector((s) => s.auth.user?.role);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchCustomers());
    dispatch(fetchJobCards());
    dispatch(fetchBills());
    dispatch(fetchInventory());
    dispatch(fetchServices());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') return;
    dispatch(fetchSlots(undefined));
    dispatch(fetchAdminAlerts());
    dispatch(fetchUsers(undefined));
    dispatch(fetchVendors());
    dispatch(fetchPurchaseOrders());
    const interval = setInterval(() => {
      dispatch(fetchAdminAlerts());
      dispatch(fetchSlots(undefined));
      dispatch(fetchCustomers());
      dispatch(fetchPurchaseOrders());
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, role]);

  // Staff (admins + workforce) poll job cards so newly assigned/updated jobs
  // appear without a manual refresh.
  useEffect(() => {
    const isStaff =
      role === 'admin' ||
      role === 'staff' ||
      role === 'service_advisor' ||
      role === 'mechanic' ||
      role === 'primary_technician';
    if (!isStaff) return;
    const interval = setInterval(() => {
      dispatch(fetchJobCards());
    }, 15_000);
    return () => clearInterval(interval);
  }, [dispatch, role]);

  return <>{children}</>;
}
