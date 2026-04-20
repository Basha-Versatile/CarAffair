import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@/features/auth/authSlice';
import customerReducer from '@/features/customers/customerSlice';
import jobCardReducer from '@/features/jobCards/jobCardSlice';
import billingReducer from '@/features/billing/billingSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import inventoryReducer from '@/features/inventory/inventorySlice';
import servicesReducer from '@/features/services/servicesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  customers: customerReducer,
  jobCards: jobCardReducer,
  billing: billingReducer,
  notifications: notificationReducer,
  inventory: inventoryReducer,
  services: servicesReducer,
});

const persistConfig = {
  key: 'caraffair-v3',
  storage,
  whitelist: ['jobCards', 'notifications', 'customers', 'auth', 'billing', 'inventory', 'services'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
