import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { JobCard, JobCardStatus, QuoteType } from '@/types';
import { api } from '@/lib/apiClient';

interface JobCardState {
  jobCards: JobCard[];
  selectedJobCard: JobCard | null;
  statusFilter: JobCardStatus | 'all';
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
}

const initialState: JobCardState = {
  jobCards: [],
  selectedJobCard: null,
  statusFilter: 'all',
  searchQuery: '',
  currentPage: 1,
  pageSize: 10,
  isLoading: false,
};

export const fetchJobCards = createAsyncThunk<JobCard[]>('jobCards/fetch', async () => {
  const res = await api.get<{ jobCards: JobCard[] }>('/api/job-cards');
  return res.jobCards ?? [];
});

export const createJobCard = createAsyncThunk<JobCard, Partial<JobCard>>('jobCards/create', async (data) => {
  const res = await api.post<{ jobCard: JobCard }>('/api/job-cards', data);
  return res.jobCard;
});

export const updateJobCardThunk = createAsyncThunk<JobCard, JobCard>('jobCards/update', async (job) => {
  const res = await api.put<{ jobCard: JobCard }>(`/api/job-cards/${job.id}`, job);
  return res.jobCard;
});

export const updateStatusThunk = createAsyncThunk<JobCard, { id: string; status: JobCardStatus }>(
  'jobCards/updateStatus',
  async ({ id, status }) => {
    const res = await api.put<{ jobCard: JobCard }>(`/api/job-cards/${id}`, { status, updatedAt: new Date().toISOString() });
    return res.jobCard;
  }
);

export const deleteJobCardThunk = createAsyncThunk<string, string>('jobCards/delete', async (id) => {
  await api.del(`/api/job-cards/${id}`);
  return id;
});

export const sendQuoteThunk = createAsyncThunk<JobCard, { id: string; quoteToken: string; quoteType?: QuoteType }>(
  'jobCards/sendQuote',
  async ({ id, ...rest }) => {
    const res = await api.put<{ jobCard: JobCard }>(`/api/job-cards/${id}`, {
      quoteToken: rest.quoteToken,
      quoteType: rest.quoteType ?? 'with_gst',
      quoteStatus: 'sent',
      quoteSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return res.jobCard;
  }
);

export const respondToQuoteThunk = createAsyncThunk<
  JobCard,
  { token: string; action: 'accepted' | 'rejected'; approvedServiceIds?: string[]; approvedPartIds?: string[] }
>('jobCards/respondToQuote', async (payload) => {
  const res = await api.post<{ jobCard: JobCard }>(`/api/quotes/${payload.token}`, payload);
  return res.jobCard;
});

const jobCardSlice = createSlice({
  name: 'jobCards',
  initialState,
  reducers: {
    setSelectedJobCard(state, action: PayloadAction<JobCard | null>) {
      state.selectedJobCard = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<JobCardStatus | 'all'>) {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchJobCards.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchJobCards.fulfilled, (s, a) => {
        s.jobCards = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchJobCards.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(createJobCard.fulfilled, (s, a) => {
        s.jobCards.unshift(a.payload);
      })
      .addCase(updateJobCardThunk.fulfilled, (s, a) => {
        const idx = s.jobCards.findIndex((j) => j.id === a.payload.id);
        if (idx !== -1) s.jobCards[idx] = a.payload;
      })
      .addCase(updateStatusThunk.fulfilled, (s, a) => {
        const idx = s.jobCards.findIndex((j) => j.id === a.payload.id);
        if (idx !== -1) s.jobCards[idx] = a.payload;
      })
      .addCase(deleteJobCardThunk.fulfilled, (s, a) => {
        s.jobCards = s.jobCards.filter((j) => j.id !== a.payload);
      })
      .addCase(sendQuoteThunk.fulfilled, (s, a) => {
        const idx = s.jobCards.findIndex((j) => j.id === a.payload.id);
        if (idx !== -1) s.jobCards[idx] = a.payload;
      })
      .addCase(respondToQuoteThunk.fulfilled, (s, a) => {
        const idx = s.jobCards.findIndex((j) => j.id === a.payload.id);
        if (idx !== -1) s.jobCards[idx] = a.payload;
        else s.jobCards.unshift(a.payload);
      });
  },
});

// Backwards-compatible aliases used across pages
export const addJobCard = createJobCard;
export const updateJobCard = updateJobCardThunk;
export const updateJobCardStatus = updateStatusThunk;
export const deleteJobCard = deleteJobCardThunk;
export const sendQuote = sendQuoteThunk;
export const respondToQuote = respondToQuoteThunk;

export const { setSelectedJobCard, setStatusFilter, setSearchQuery, setCurrentPage } = jobCardSlice.actions;
export default jobCardSlice.reducer;
