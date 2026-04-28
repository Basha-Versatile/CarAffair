import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ServiceItem } from '@/types';
import { api } from '@/lib/apiClient';

interface ServicesState {
  services: ServiceItem[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
}

const initialState: ServicesState = {
  services: [],
  searchQuery: '',
  currentPage: 1,
  pageSize: 9,
  isLoading: false,
};

export const fetchServices = createAsyncThunk<ServiceItem[]>('services/fetch', async () => {
  const res = await api.get<{ services: ServiceItem[] }>('/api/services');
  return res.services ?? [];
});

export const createService = createAsyncThunk<ServiceItem, Partial<ServiceItem>>('services/create', async (data) => {
  const res = await api.post<{ service: ServiceItem }>('/api/services', data);
  return res.service;
});

export const updateServiceThunk = createAsyncThunk<ServiceItem, ServiceItem>('services/update', async (item) => {
  const res = await api.put<{ service: ServiceItem }>(`/api/services/${item.id}`, item);
  return res.service;
});

export const deleteServiceThunk = createAsyncThunk<string, string>('services/delete', async (id) => {
  await api.del(`/api/services/${id}`);
  return id;
});

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServicesSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setServicesPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchServices.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchServices.fulfilled, (s, a) => {
        s.services = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchServices.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(createService.fulfilled, (s, a) => {
        s.services.unshift(a.payload);
      })
      .addCase(updateServiceThunk.fulfilled, (s, a) => {
        const idx = s.services.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.services[idx] = a.payload;
      })
      .addCase(deleteServiceThunk.fulfilled, (s, a) => {
        s.services = s.services.filter((x) => x.id !== a.payload);
      });
  },
});

export const addService = createService;
export const updateService = updateServiceThunk;
export const deleteService = deleteServiceThunk;
export const { setServicesSearch, setServicesPage } = servicesSlice.actions;
export default servicesSlice.reducer;
