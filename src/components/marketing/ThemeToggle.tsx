'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';

const order = ['light', 'dark', 'system'] as const;
type Mode = typeof order[number];

const meta: Record<Mode, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light' },
  dark: { icon: Moon, label: 'Dark' },
  system: { icon: Monitor, label: 'System' },
};

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Theme"
        className={cn('w-10 h-10 rounded-full glass-card flex items-center justify-center', compact && 'w-9 h-9')}
      >
        <Sun className="h-4 w-4 opacity-0" />
      </button>
    );
  }

  const current: Mode = (theme === 'system' ? 'system' : (resolvedTheme === 'dark' ? 'dark' : 'light')) as Mode;
  const Icon = meta[current].icon;

  const cycle = () => {
    const next = order[(order.indexOf(current) + 1) % order.length];
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${meta[current].label} (click to switch)`}
      aria-label={`Switch theme. Current: ${meta[current].label}`}
      className={cn(
        'group relative rounded-full glass-card flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 transition-all',
        compact ? 'w-9 h-9' : 'w-10 h-10'
      )}
    >
      <Icon className="h-4 w-4 transition-transform group-hover:rotate-12" />
    </button>
  );
}
