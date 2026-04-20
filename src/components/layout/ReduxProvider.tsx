'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { REHYDRATE } from 'redux-persist';
import { store, persistor } from '@/store/store';

function CrossTabSync() {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'persist:caraffair' && e.newValue) {
        // Another tab updated the persisted state — rehydrate this tab
        const parsed: Record<string, string> = JSON.parse(e.newValue);
        const rehydratedState: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (key !== '_persist') {
            try { rehydratedState[key] = JSON.parse(value); } catch { rehydratedState[key] = value; }
          }
        }
        store.dispatch({ type: REHYDRATE, key: 'caraffair', payload: rehydratedState });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  return null;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CrossTabSync />
        {children}
      </PersistGate>
    </Provider>
  );
}
