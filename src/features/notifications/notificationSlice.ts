import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification, NotificationStatus, SystemAlert } from '@/types';
import { api } from '@/lib/apiClient';

export const fetchAdminAlerts = createAsyncThunk<SystemAlert[]>(
  'notifications/fetchAdminAlerts',
  async () => {
    const res = await api.get<{ alerts: SystemAlert[] }>('/api/alerts');
    return res.alerts ?? [];
  }
);

export const markAdminAlertRead = createAsyncThunk<string, string>(
  'notifications/markAdminAlertRead',
  async (id) => {
    await api.patch(`/api/alerts/${id}`, {});
    return id;
  }
);

interface NotificationState {
  notifications: Notification[];
  alerts: SystemAlert[];
  isLoading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  alerts: [],
  isLoading: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
    },
    updateNotificationStatus(
      state,
      action: PayloadAction<{ id: string; status: NotificationStatus; timestamp: string }>
    ) {
      const notification = state.notifications.find((n) => n.id === action.payload.id);
      if (notification) {
        notification.status = action.payload.status;
        if (action.payload.status === 'delivered') notification.deliveredAt = action.payload.timestamp;
        if (action.payload.status === 'opened') notification.openedAt = action.payload.timestamp;
        if (action.payload.status === 'accepted' || action.payload.status === 'rejected') {
          notification.respondedAt = action.payload.timestamp;
        }
      }
    },
    updateNotificationsByToken(
      state,
      action: PayloadAction<{ quoteToken: string; status: NotificationStatus; timestamp: string }>
    ) {
      state.notifications
        .filter((n) => n.quoteToken === action.payload.quoteToken)
        .forEach((n) => {
          n.status = action.payload.status;
          n.respondedAt = action.payload.timestamp;
        });
    },
    addAlert(state, action: PayloadAction<SystemAlert>) {
      if (!state.alerts) state.alerts = [];
      state.alerts.unshift(action.payload);
    },
    markAlertRead(state, action: PayloadAction<string>) {
      if (!state.alerts) return;
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert) alert.read = true;
    },
    markAllAlertsRead(state) {
      if (!state.alerts) return;
      state.alerts.forEach((a) => { a.read = true; });
    },
    clearAlerts(state) {
      state.alerts = [];
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAdminAlerts.fulfilled, (state, action) => {
      // Merge: server alerts override matching ids; preserve any client-only alerts.
      const serverIds = new Set(action.payload.map((a) => a.id));
      const clientOnly = (state.alerts ?? []).filter((a) => !serverIds.has(a.id));
      state.alerts = [...action.payload, ...clientOnly];
    }).addCase(markAdminAlertRead.fulfilled, (state, action) => {
      const alert = (state.alerts ?? []).find((a) => a.id === action.payload);
      if (alert) alert.read = true;
    });
  },
});

export const {
  addNotification, updateNotificationStatus, updateNotificationsByToken,
  addAlert, markAlertRead, markAllAlertsRead, clearAlerts,
} = notificationSlice.actions;
export default notificationSlice.reducer;
