import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ServiceItem } from '@/types';
import { availableServices } from '@/lib/mockData';

interface ServicesState {
  services: ServiceItem[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
}

const initialState: ServicesState = {
  services: availableServices,
  searchQuery: '',
  currentPage: 1,
  pageSize: 9,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    addService(state, action: PayloadAction<ServiceItem>) {
      state.services.unshift(action.payload);
    },
    updateService(state, action: PayloadAction<ServiceItem>) {
      const index = state.services.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) state.services[index] = action.payload;
    },
    deleteService(state, action: PayloadAction<string>) {
      state.services = state.services.filter((s) => s.id !== action.payload);
    },
    setServicesSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setServicesPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
});

export const { addService, updateService, deleteService, setServicesSearch, setServicesPage } = servicesSlice.actions;
export default servicesSlice.reducer;
