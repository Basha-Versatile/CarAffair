import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Slot } from '@/types';
import { api } from '@/lib/apiClient';

interface SlotsState {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SlotsState = {
  slots: [],
  isLoading: false,
  error: null,
};

export const fetchSlots = createAsyncThunk<Slot[], { from?: string; to?: string } | undefined>(
  'slots/fetch',
  async (range) => {
    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    const qs = params.toString();
    const res = await api.get<{ slots: Slot[] }>(`/api/slots${qs ? `?${qs}` : ''}`);
    return res.slots ?? [];
  }
);

export const createSlot = createAsyncThunk<Slot, { date: string; startTime: string; endTime: string }>(
  'slots/create',
  async (data) => {
    const res = await api.post<{ slot: Slot }>('/api/slots', data);
    return res.slot;
  }
);

export const updateSlotStatus = createAsyncThunk<Slot, { id: string; status: 'available' | 'disabled' }>(
  'slots/updateStatus',
  async ({ id, status }) => {
    const res = await api.patch<{ slot: Slot }>(`/api/slots/${id}`, { status });
    return res.slot;
  }
);

export const deleteSlot = createAsyncThunk<string, string>('slots/delete', async (id) => {
  await api.del(`/api/slots/${id}`);
  return id;
});

const slotsSlice = createSlice({
  name: 'slots',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSlots.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchSlots.fulfilled, (s, a) => {
        s.slots = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchSlots.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createSlot.fulfilled, (s, a) => {
        s.slots.push(a.payload);
        s.slots.sort((x, y) => (x.date === y.date ? x.startTime.localeCompare(y.startTime) : x.date.localeCompare(y.date)));
      })
      .addCase(updateSlotStatus.fulfilled, (s, a) => {
        const idx = s.slots.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.slots[idx] = a.payload;
      })
      .addCase(deleteSlot.fulfilled, (s, a) => {
        s.slots = s.slots.filter((x) => x.id !== a.payload);
      });
  },
});

export default slotsSlice.reducer;
