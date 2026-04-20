'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; iconColor: string; glow: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  error: {
    icon: XCircle,
    bg: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  info: {
    icon: Info,
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
};

const progressColors: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-96 max-w-[calc(100vw-2rem)]">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const config = toastConfig[t.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl',
                  `bg-gradient-to-r ${config.bg}`,
                  config.border,
                  config.glow
                )}
                style={{ background: 'var(--bg-glass-strong)' }}
              >
                {/* Gradient overlay */}
                <div className={cn('absolute inset-0 bg-gradient-to-r opacity-30', config.bg)} />

                <div className="relative z-10 flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', `bg-gradient-to-br ${config.bg}`)}>
                    <Icon className={cn('h-5 w-5', config.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>
                    {t.message && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{t.message}</p>
                    )}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => removeToast(t.id)}
                    className="flex-shrink-0 p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="relative h-1 w-full bg-[var(--border-color)]">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 4, ease: 'linear' }}
                    className={cn('h-full rounded-full', progressColors[t.type])}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
