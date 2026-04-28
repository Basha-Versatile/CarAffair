import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { InventoryItem } from '@/types';
import { api } from '@/lib/apiClient';

interface InventoryState {
  items: InventoryItem[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
}

const initialState: InventoryState = {
  items: [],
  searchQuery: '',
  currentPage: 1,
  pageSize: 9,
  isLoading: false,
};

export const fetchInventory = createAsyncThunk<InventoryItem[]>('inventory/fetch', async () => {
  const res = await api.get<{ items: InventoryItem[] }>('/api/inventory');
  return res.items ?? [];
});

export const createInventoryItem = createAsyncThunk<InventoryItem, Partial<InventoryItem>>(
  'inventory/create',
  async (data) => {
    const res = await api.post<{ item: InventoryItem }>('/api/inventory', data);
    return res.item;
  }
);

export const updateInventoryItemThunk = createAsyncThunk<InventoryItem, InventoryItem>(
  'inventory/update',
  async (item) => {
    const res = await api.put<{ item: InventoryItem }>(`/api/inventory/${item.id}`, item);
    return res.item;
  }
);

export const deleteInventoryItemThunk = createAsyncThunk<string, string>('inventory/delete', async (id) => {
  await api.del(`/api/inventory/${id}`);
  return id;
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventorySearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setInventoryPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchInventory.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchInventory.fulfilled, (s, a) => {
        s.items = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchInventory.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(createInventoryItem.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
      })
      .addCase(updateInventoryItemThunk.fulfilled, (s, a) => {
        const idx = s.items.findIndex((i) => i.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(deleteInventoryItemThunk.fulfilled, (s, a) => {
        s.items = s.items.filter((i) => i.id !== a.payload);
      });
  },
});

export const addInventoryItem = createInventoryItem;
export const updateInventoryItem = updateInventoryItemThunk;
export const deleteInventoryItem = deleteInventoryItemThunk;
export const { setInventorySearch, setInventoryPage } = inventorySlice.actions;
export default inventorySlice.reducer;
