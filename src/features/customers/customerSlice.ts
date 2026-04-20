import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Customer, Vehicle } from '@/types';
import { mockCustomers, mockVehicles } from '@/lib/mockData';

interface CustomerState {
  customers: Customer[];
  vehicles: Vehicle[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  isLoading: boolean;
}

const customersWithVehicles = mockCustomers.map((c) => ({
  ...c,
  vehicles: mockVehicles.filter((v) => v.customerId === c.id),
}));

const initialState: CustomerState = {
  customers: customersWithVehicles,
  vehicles: mockVehicles,
  selectedCustomer: null,
  searchQuery: '',
  isLoading: false,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer(state, action: PayloadAction<Customer>) {
      state.customers.push(action.payload);
    },
    updateCustomer(state, action: PayloadAction<Customer>) {
      const index = state.customers.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) state.customers[index] = action.payload;
    },
    deleteCustomer(state, action: PayloadAction<string>) {
      state.customers = state.customers.filter((c) => c.id !== action.payload);
    },
    addVehicle(state, action: PayloadAction<Vehicle>) {
      state.vehicles.push(action.payload);
      const customer = state.customers.find((c) => c.id === action.payload.customerId);
      if (customer) customer.vehicles.push(action.payload);
    },
    updateVehicle(state, action: PayloadAction<Vehicle>) {
      const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) state.vehicles[index] = action.payload;
      const customer = state.customers.find((c) => c.id === action.payload.customerId);
      if (customer) {
        const vIdx = customer.vehicles.findIndex((v) => v.id === action.payload.id);
        if (vIdx !== -1) customer.vehicles[vIdx] = action.payload;
      }
    },
    setSelectedCustomer(state, action: PayloadAction<Customer | null>) {
      state.selectedCustomer = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const { addCustomer, updateCustomer, deleteCustomer, addVehicle, updateVehicle, setSelectedCustomer, setSearchQuery } = customerSlice.actions;
export default customerSlice.reducer;
