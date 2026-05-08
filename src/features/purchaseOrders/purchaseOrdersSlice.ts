import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PurchaseOrder } from '@/types';
import { api } from '@/lib/apiClient';

interface POState {
  orders: PurchaseOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: POState = {
  orders: [],
  isLoading: false,
  error: null,
};

export const fetchPurchaseOrders = createAsyncThunk<PurchaseOrder[]>('po/fetch', async () => {
  const res = await api.get<{ purchaseOrders: PurchaseOrder[] }>('/api/purchase-orders');
  return res.purchaseOrders ?? [];
});

export interface CreatePurchaseOrderInput {
  vendorId: string;
  items: Array<{
    inventoryItemId?: string;
    name: string;
    partNumber?: string;
    quantity: number;
    notes?: string;
  }>;
  relatedJobCardId?: string;
  notes?: string;
  send?: boolean;
}

export const createPurchaseOrderThunk = createAsyncThunk<PurchaseOrder, CreatePurchaseOrderInput>(
  'po/create',
  async (input) => {
    const res = await api.post<{ purchaseOrder: PurchaseOrder }>('/api/purchase-orders', input);
    return res.purchaseOrder;
  }
);

export type POAction = 'send' | 'accept' | 'reject' | 'dispatch' | 'receive' | 'cancel' | 'edit-items';

export const updatePurchaseOrderThunk = createAsyncThunk<
  PurchaseOrder,
  { id: string; action: POAction; reason?: string; items?: CreatePurchaseOrderInput['items'] }
>('po/update', async ({ id, ...rest }) => {
  const res = await api.patch<{ purchaseOrder: PurchaseOrder }>(`/api/purchase-orders/${id}`, rest);
  return res.purchaseOrder;
});

export const deletePurchaseOrderThunk = createAsyncThunk<string, string>('po/delete', async (id) => {
  await api.del(`/api/purchase-orders/${id}`);
  return id;
});

const slice = createSlice({
  name: 'purchaseOrders',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPurchaseOrders.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchPurchaseOrders.fulfilled, (s, a) => {
        s.orders = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchPurchaseOrders.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createPurchaseOrderThunk.fulfilled, (s, a) => {
        s.orders.unshift(a.payload);
      })
      .addCase(updatePurchaseOrderThunk.fulfilled, (s, a) => {
        const idx = s.orders.findIndex((o) => o.id === a.payload.id);
        if (idx !== -1) s.orders[idx] = a.payload;
      })
      .addCase(deletePurchaseOrderThunk.fulfilled, (s, a) => {
        s.orders = s.orders.filter((o) => o.id !== a.payload);
      });
  },
});

export default slice.reducer;
