import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { InventoryItem } from '@/types';
import { mockInventory } from '@/lib/mockData';

interface InventoryState {
  items: InventoryItem[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
}

const initialState: InventoryState = {
  items: mockInventory,
  searchQuery: '',
  currentPage: 1,
  pageSize: 9,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addInventoryItem(state, action: PayloadAction<InventoryItem>) {
      state.items.unshift(action.payload);
    },
    updateInventoryItem(state, action: PayloadAction<InventoryItem>) {
      const index = state.items.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    deleteInventoryItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    setInventorySearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setInventoryPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
});

export const { addInventoryItem, updateInventoryItem, deleteInventoryItem, setInventorySearch, setInventoryPage } = inventorySlice.actions;
export default inventorySlice.reducer;
