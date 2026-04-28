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
    const interval = setInterval(() => {
      dispatch(fetchAdminAlerts());
      dispatch(fetchSlots(undefined));
      dispatch(fetchCustomers());
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, role]);

  return <>{children}</>;
}
