import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Bill } from '@/types';
import { api } from '@/lib/apiClient';

interface BillingState {
  bills: Bill[];
  selectedBill: Bill | null;
  isLoading: boolean;
}

const initialState: BillingState = {
  bills: [],
  selectedBill: null,
  isLoading: false,
};

export const fetchBills = createAsyncThunk<Bill[]>('billing/fetch', async () => {
  const res = await api.get<{ bills: Bill[] }>('/api/bills');
  return res.bills ?? [];
});

export const createBill = createAsyncThunk<Bill, Partial<Bill>>('billing/create', async (data) => {
  const res = await api.post<{ bill: Bill }>('/api/bills', data);
  return res.bill;
});

export const updateBillThunk = createAsyncThunk<Bill, Bill>('billing/update', async (bill) => {
  const res = await api.put<{ bill: Bill }>(`/api/bills/${bill.id}`, bill);
  return res.bill;
});

const patchBill = createAsyncThunk<Bill, { id: string; patch: Partial<Bill> }>('billing/patch', async ({ id, patch }) => {
  const res = await api.put<{ bill: Bill }>(`/api/bills/${id}`, patch);
  return res.bill;
});

export const markBillPaidThunk = createAsyncThunk<Bill, { id: string; paymentMethod: 'cash' | 'card' | 'qr' }>(
  'billing/markPaid',
  async ({ id, paymentMethod }, { dispatch }) => {
    const res = await dispatch(
      patchBill({
        id,
        patch: {
          status: 'paid',
          paymentMethod,
          paidAt: new Date().toISOString(),
          paymentLinkStatus: 'paid',
        },
      })
    ).unwrap();
    return res;
  }
);

export const sendPaymentLinkThunk = createAsyncThunk<Bill, { id: string; paymentToken: string }>(
  'billing/sendPaymentLink',
  async ({ id, paymentToken }, { dispatch }) => {
    return dispatch(
      patchBill({
        id,
        patch: {
          paymentToken,
          paymentLinkStatus: 'sent',
          paymentLinkSentAt: new Date().toISOString(),
        },
      })
    ).unwrap();
  }
);

export const markBillPaidByTokenThunk = createAsyncThunk<
  Bill | null,
  { token: string; paymentMethod: 'cash' | 'card' | 'qr' }
>('billing/markPaidByToken', async ({ token, paymentMethod }, { getState, dispatch }) => {
  const state = getState() as { billing: BillingState };
  const bill = state.billing.bills.find((b) => b.paymentToken === token);
  if (!bill) return null;
  return dispatch(
    patchBill({
      id: bill.id,
      patch: {
        status: 'paid',
        paymentMethod,
        paidAt: new Date().toISOString(),
        paymentLinkStatus: 'paid',
      },
    })
  ).unwrap();
});

export const sendReviewLinkThunk = createAsyncThunk<Bill, { id: string; reviewToken: string }>(
  'billing/sendReviewLink',
  async ({ id, reviewToken }, { dispatch }) => {
    return dispatch(
      patchBill({
        id,
        patch: {
          reviewToken,
          reviewStatus: 'sent',
          reviewSentAt: new Date().toISOString(),
        },
      })
    ).unwrap();
  }
);

export const sendReviewLinkByPaymentTokenThunk = createAsyncThunk<
  Bill | null,
  { paymentToken: string; reviewToken: string }
>('billing/sendReviewLinkByPaymentToken', async ({ paymentToken, reviewToken }, { getState, dispatch }) => {
  const state = getState() as { billing: BillingState };
  const bill = state.billing.bills.find((b) => b.paymentToken === paymentToken);
  if (!bill) return null;
  return dispatch(
    patchBill({
      id: bill.id,
      patch: {
        reviewToken,
        reviewStatus: 'sent',
        reviewSentAt: new Date().toISOString(),
      },
    })
  ).unwrap();
});

export const submitReviewThunk = createAsyncThunk<Bill | null, { token: string; rating: number; comment: string }>(
  'billing/submitReview',
  async ({ token, rating, comment }, { getState, dispatch }) => {
    const state = getState() as { billing: BillingState };
    const bill = state.billing.bills.find((b) => b.reviewToken === token);
    if (!bill) return null;
    return dispatch(
      patchBill({
        id: bill.id,
        patch: {
          reviewStatus: 'submitted',
          reviewRating: rating,
          reviewComment: comment,
          reviewSubmittedAt: new Date().toISOString(),
        },
      })
    ).unwrap();
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setSelectedBill(state, action: PayloadAction<Bill | null>) {
      state.selectedBill = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchBills.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchBills.fulfilled, (s, a) => {
        s.bills = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchBills.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(createBill.fulfilled, (s, a) => {
        s.bills.push(a.payload);
      })
      .addCase(patchBill.fulfilled, (s, a) => {
        const idx = s.bills.findIndex((b) => b.id === a.payload.id);
        if (idx !== -1) s.bills[idx] = a.payload;
      })
      .addCase(updateBillThunk.fulfilled, (s, a) => {
        const idx = s.bills.findIndex((b) => b.id === a.payload.id);
        if (idx !== -1) s.bills[idx] = a.payload;
      });
  },
});

// Backwards-compatible names used by pages
export const addBill = createBill;
export const updateBill = updateBillThunk;
export const markBillPaid = markBillPaidThunk;
export const sendPaymentLink = sendPaymentLinkThunk;
export const markBillPaidByToken = markBillPaidByTokenThunk;
export const sendReviewLink = sendReviewLinkThunk;
export const sendReviewLinkByPaymentToken = sendReviewLinkByPaymentTokenThunk;
export const submitReview = submitReviewThunk;
export const { setSelectedBill } = billingSlice.actions;
export default billingSlice.reducer;
