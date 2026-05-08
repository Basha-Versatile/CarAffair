'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: (value?: string) => void | Promise<void>;
  onClose: () => void;

  // Prompt mode: when these are set, the dialog renders a text input and
  // passes the entered value to onConfirm.
  promptLabel?: string;
  promptPlaceholder?: string;
  promptInitialValue?: string;
  promptRequired?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onClose,
  promptLabel,
  promptPlaceholder,
  promptInitialValue,
  promptRequired,
}: ConfirmDialogProps) {
  const isPrompt = typeof promptLabel === 'string';
  const [value, setValue] = useState(promptInitialValue ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setValue(promptInitialValue ?? '');
  }, [isOpen, promptInitialValue]);

  const handleConfirm = async () => {
    if (isPrompt && promptRequired && !value.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(isPrompt ? value : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {(message || destructive) && (
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            )}
            {message && (
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{message}</p>
            )}
          </div>
        )}

        {isPrompt && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              {promptLabel}
            </label>
            <textarea
              autoFocus
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={promptPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={submitting}
            disabled={isPrompt && promptRequired ? !value.trim() : false}
            className={`flex-1 ${destructive ? '!bg-gradient-to-r !from-red-600 !to-red-700 hover:!from-red-500 hover:!to-red-600' : ''}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
