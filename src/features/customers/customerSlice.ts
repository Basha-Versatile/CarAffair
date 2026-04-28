import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Customer, Vehicle } from '@/types';
import { api } from '@/lib/apiClient';

interface CustomerState {
  customers: Customer[];
  vehicles: Vehicle[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  vehicles: [],
  selectedCustomer: null,
  searchQuery: '',
  isLoading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk<{ customers: Customer[]; vehicles: Vehicle[] }>(
  'customers/fetch',
  async () => {
    const res = await api.get<{ customers: Customer[] }>('/api/customers');
    const customers = res.customers ?? [];
    const vehicles = customers.flatMap((c) => c.vehicles ?? []);
    return { customers, vehicles };
  }
);

export const createCustomer = createAsyncThunk<Customer, Partial<Customer>>(
  'customers/create',
  async (data) => {
    const res = await api.post<{ customer: Customer }>('/api/customers', data);
    return { ...res.customer, vehicles: res.customer.vehicles ?? [] };
  }
);

export const updateCustomerThunk = createAsyncThunk<Customer, Customer>(
  'customers/update',
  async (customer) => {
    const res = await api.put<{ customer: Customer }>(`/api/customers/${customer.id}`, customer);
    return { ...res.customer, vehicles: customer.vehicles };
  }
);

export const deleteCustomerThunk = createAsyncThunk<string, string>('customers/delete', async (id) => {
  await api.del(`/api/customers/${id}`);
  return id;
});

export const createVehicle = createAsyncThunk<Vehicle, Partial<Vehicle>>('vehicles/create', async (data) => {
  const res = await api.post<{ vehicle: Vehicle }>('/api/vehicles', data);
  return res.vehicle;
});

export const updateVehicleThunk = createAsyncThunk<Vehicle, Vehicle>('vehicles/update', async (vehicle) => {
  const res = await api.put<{ vehicle: Vehicle }>(`/api/vehicles/${vehicle.id}`, vehicle);
  return res.vehicle;
});

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer(state, action: PayloadAction<Customer | null>) {
      state.selectedCustomer = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchCustomers.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchCustomers.fulfilled, (s, a) => {
        s.customers = a.payload.customers;
        s.vehicles = a.payload.vehicles;
        s.isLoading = false;
      })
      .addCase(fetchCustomers.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createCustomer.fulfilled, (s, a) => {
        s.customers.push(a.payload);
      })
      .addCase(updateCustomerThunk.fulfilled, (s, a) => {
        const idx = s.customers.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.customers[idx] = a.payload;
      })
      .addCase(deleteCustomerThunk.fulfilled, (s, a) => {
        s.customers = s.customers.filter((c) => c.id !== a.payload);
        s.vehicles = s.vehicles.filter((v) => v.customerId !== a.payload);
      })
      .addCase(createVehicle.fulfilled, (s, a) => {
        s.vehicles.push(a.payload);
        const cust = s.customers.find((c) => c.id === a.payload.customerId);
        if (cust) cust.vehicles.push(a.payload);
      })
      .addCase(updateVehicleThunk.fulfilled, (s, a) => {
        const idx = s.vehicles.findIndex((v) => v.id === a.payload.id);
        if (idx !== -1) s.vehicles[idx] = a.payload;
        const cust = s.customers.find((c) => c.id === a.payload.customerId);
        if (cust) {
          const vIdx = cust.vehicles.findIndex((v) => v.id === a.payload.id);
          if (vIdx !== -1) cust.vehicles[vIdx] = a.payload;
        }
      });
  },
});

// Backwards-compatible names so existing pages don't break.
export const addCustomer = createCustomer;
export const updateCustomer = updateCustomerThunk;
export const deleteCustomer = deleteCustomerThunk;
export const addVehicle = createVehicle;
export const updateVehicle = updateVehicleThunk;
export const { setSelectedCustomer, setSearchQuery } = customerSlice.actions;
export default customerSlice.reducer;
