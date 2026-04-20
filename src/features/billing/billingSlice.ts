import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Bill } from '@/types';
import { mockBills } from '@/lib/mockData';

interface BillingState {
  bills: Bill[];
  selectedBill: Bill | null;
  isLoading: boolean;
}

const initialState: BillingState = {
  bills: mockBills,
  selectedBill: null,
  isLoading: false,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    addBill(state, action: PayloadAction<Bill>) {
      state.bills.push(action.payload);
    },
    updateBill(state, action: PayloadAction<Bill>) {
      const index = state.bills.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) state.bills[index] = action.payload;
    },
    markBillPaid(state, action: PayloadAction<{ id: string; paymentMethod: 'cash' | 'card' | 'qr' }>) {
      const bill = state.bills.find((b) => b.id === action.payload.id);
      if (bill) {
        bill.status = 'paid';
        bill.paymentMethod = action.payload.paymentMethod;
        bill.paidAt = new Date().toISOString();
        bill.paymentLinkStatus = 'paid';
      }
    },
    setSelectedBill(state, action: PayloadAction<Bill | null>) {
      state.selectedBill = action.payload;
    },
    sendPaymentLink(state, action: PayloadAction<{ id: string; paymentToken: string }>) {
      const bill = state.bills.find((b) => b.id === action.payload.id);
      if (bill) {
        bill.paymentToken = action.payload.paymentToken;
        bill.paymentLinkStatus = 'sent';
        bill.paymentLinkSentAt = new Date().toISOString();
      }
    },
    markBillPaidByToken(state, action: PayloadAction<{ token: string; paymentMethod: 'cash' | 'card' | 'qr' }>) {
      const bill = state.bills.find((b) => b.paymentToken === action.payload.token);
      if (bill) {
        bill.status = 'paid';
        bill.paymentMethod = action.payload.paymentMethod;
        bill.paidAt = new Date().toISOString();
        bill.paymentLinkStatus = 'paid';
      }
    },
    sendReviewLink(state, action: PayloadAction<{ id: string; reviewToken: string }>) {
      const bill = state.bills.find((b) => b.id === action.payload.id);
      if (bill) {
        bill.reviewToken = action.payload.reviewToken;
        bill.reviewStatus = 'sent';
        bill.reviewSentAt = new Date().toISOString();
      }
    },
    sendReviewLinkByPaymentToken(state, action: PayloadAction<{ paymentToken: string; reviewToken: string }>) {
      const bill = state.bills.find((b) => b.paymentToken === action.payload.paymentToken);
      if (bill) {
        bill.reviewToken = action.payload.reviewToken;
        bill.reviewStatus = 'sent';
        bill.reviewSentAt = new Date().toISOString();
      }
    },
    submitReview(state, action: PayloadAction<{ token: string; rating: number; comment: string }>) {
      const bill = state.bills.find((b) => b.reviewToken === action.payload.token);
      if (bill) {
        bill.reviewStatus = 'submitted';
        bill.reviewRating = action.payload.rating;
        bill.reviewComment = action.payload.comment;
        bill.reviewSubmittedAt = new Date().toISOString();
      }
    },
  },
});

export const { addBill, updateBill, markBillPaid, setSelectedBill, sendPaymentLink, markBillPaidByToken, sendReviewLink, sendReviewLinkByPaymentToken, submitReview } = billingSlice.actions;
export default billingSlice.reducer;
