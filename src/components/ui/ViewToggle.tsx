'use client';

import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-xl glass border border-[var(--border-color)] p-1">
      {(['list', 'grid'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'relative p-2 rounded-lg transition-all duration-200',
            view === v ? 'text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          )}
        >
          {view === v && (
            <motion.div
              layoutId="viewToggleBg"
              className="absolute inset-0 rounded-lg bg-red-600"
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            />
          )}
          <span className="relative z-10">
            {v === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </span>
        </button>
      ))}
    </div>
  );
}
