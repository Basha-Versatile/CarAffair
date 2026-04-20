import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { JobCard, JobCardStatus, QuoteType } from '@/types';
import { GST_RATE } from '@/types';
import { mockJobCards } from '@/lib/mockData';

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
  jobCards: mockJobCards,
  selectedJobCard: null,
  statusFilter: 'all',
  searchQuery: '',
  currentPage: 1,
  pageSize: 10,
  isLoading: false,
};

const jobCardSlice = createSlice({
  name: 'jobCards',
  initialState,
  reducers: {
    addJobCard(state, action: PayloadAction<JobCard>) {
      state.jobCards.unshift(action.payload);
    },
    updateJobCard(state, action: PayloadAction<JobCard>) {
      const index = state.jobCards.findIndex((j) => j.id === action.payload.id);
      if (index !== -1) state.jobCards[index] = action.payload;
    },
    updateJobCardStatus(state, action: PayloadAction<{ id: string; status: JobCardStatus }>) {
      const job = state.jobCards.find((j) => j.id === action.payload.id);
      if (job) {
        job.status = action.payload.status;
        job.updatedAt = new Date().toISOString();
      }
    },
    deleteJobCard(state, action: PayloadAction<string>) {
      state.jobCards = state.jobCards.filter((j) => j.id !== action.payload);
    },
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
    sendQuote(state, action: PayloadAction<{ id: string; quoteToken: string; quoteType?: QuoteType }>) {
      const job = state.jobCards.find((j) => j.id === action.payload.id);
      if (job) {
        job.quoteToken = action.payload.quoteToken;
        job.quoteStatus = 'sent';
        job.quoteSentAt = new Date().toISOString();
        job.updatedAt = new Date().toISOString();
        const quoteType: QuoteType = action.payload.quoteType ?? 'with_gst';
        job.quoteType = quoteType;
        const subtotal = job.estimatedCost;
        const taxAmount = quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0;
        job.quoteSubtotal = subtotal;
        job.quoteTaxAmount = taxAmount;
        job.quoteTotal = subtotal + taxAmount;
      }
    },
    respondToQuote(state, action: PayloadAction<{ token: string; action: 'accepted' | 'rejected'; approvedServiceIds?: string[]; approvedPartIds?: string[] }>) {
      const job = state.jobCards.find((j) => j.quoteToken === action.payload.token);
      if (job) {
        job.quoteStatus = action.payload.action;
        job.quoteRespondedAt = new Date().toISOString();
        job.updatedAt = new Date().toISOString();
        if (action.payload.action === 'accepted') {
          job.status = 'approved';
          const approvedServiceIds = action.payload.approvedServiceIds ?? job.services.map((s) => s.id);
          const approvedPartIds = action.payload.approvedPartIds ?? job.parts.map((p) => p.id);
          job.approvedServiceIds = approvedServiceIds;
          job.approvedPartIds = approvedPartIds;
          const servicesCost = job.services.filter((s) => approvedServiceIds.includes(s.id)).reduce((sum, s) => sum + s.cost, 0);
          const partsCost = job.parts.filter((p) => approvedPartIds.includes(p.id)).reduce((sum, p) => sum + p.totalCost, 0);
          const subtotal = servicesCost + partsCost;
          job.estimatedCost = subtotal;
          job.quoteSubtotal = subtotal;
          const taxAmount = job.quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0;
          job.quoteTaxAmount = taxAmount;
          job.quoteTotal = subtotal + taxAmount;
        } else {
          job.approvedServiceIds = [];
          job.approvedPartIds = [];
        }
      }
    },
  },
});

export const { addJobCard, updateJobCard, updateJobCardStatus, deleteJobCard, setSelectedJobCard, setStatusFilter, setSearchQuery, setCurrentPage, sendQuote, respondToQuote } = jobCardSlice.actions;
export default jobCardSlice.reducer;
