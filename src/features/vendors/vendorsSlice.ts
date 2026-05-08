import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Vendor } from '@/types';
import { api } from '@/lib/apiClient';

interface VendorsState {
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VendorsState = {
  vendors: [],
  isLoading: false,
  error: null,
};

export const fetchVendors = createAsyncThunk<Vendor[]>('vendors/fetch', async () => {
  const res = await api.get<{ vendors: Vendor[] }>('/api/vendors');
  return res.vendors ?? [];
});

export const createVendor = createAsyncThunk<Vendor, Partial<Vendor>>('vendors/create', async (data) => {
  const res = await api.post<{ vendor: Vendor }>('/api/vendors', data);
  return res.vendor;
});

export const updateVendorThunk = createAsyncThunk<Vendor, { id: string } & Partial<Vendor>>(
  'vendors/update',
  async ({ id, ...patch }) => {
    const res = await api.patch<{ vendor: Vendor }>(`/api/vendors/${id}`, patch);
    return res.vendor;
  }
);

export const deleteVendorThunk = createAsyncThunk<string, string>('vendors/delete', async (id) => {
  await api.del(`/api/vendors/${id}`);
  return id;
});

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchVendors.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchVendors.fulfilled, (s, a) => {
        s.vendors = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchVendors.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createVendor.fulfilled, (s, a) => {
        s.vendors.unshift(a.payload);
      })
      .addCase(updateVendorThunk.fulfilled, (s, a) => {
        const idx = s.vendors.findIndex((v) => v.id === a.payload.id);
        if (idx !== -1) s.vendors[idx] = a.payload;
      })
      .addCase(deleteVendorThunk.fulfilled, (s, a) => {
        s.vendors = s.vendors.filter((v) => v.id !== a.payload);
      });
  },
});

export default vendorsSlice.reducer;
