'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/features/auth/authSlice';
import { persistor } from '@/store/store';

export function useSignOut() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // server-side cookie clear is best-effort; continue with client cleanup
    }

    try {
      await persistor.purge();
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      try {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith('persist:') || k.toLowerCase().includes('caraffair'))
          .forEach((k) => window.localStorage.removeItem(k));
        Object.keys(window.sessionStorage)
          .filter((k) => k.startsWith('persist:') || k.toLowerCase().includes('caraffair'))
          .forEach((k) => window.sessionStorage.removeItem(k));
      } catch {
        // ignore
      }

      // Defensively clear the session cookie client-side too (server already cleared it).
      document.cookie = 'caraffair_session=; Path=/; Max-Age=0; SameSite=Lax';
    }

    router.replace('/admin/login');
    router.refresh();
  };
}
