'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import AppBootstrap from './AppBootstrap';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppBootstrap>{children}</AppBootstrap>
    </Provider>
  );
}
