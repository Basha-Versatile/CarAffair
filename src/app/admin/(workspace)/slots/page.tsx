'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CalendarDays, Clock, Pause, Play } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSlots, createSlot, updateSlotStatus, deleteSlot } from '@/features/slots/slotsSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useModal } from '@/hooks/useModal';
import { Skeleton, SkeletonHeader } from '@/components/ui/Skeleton';
import { format12h, to24h, HOURS_12, MINUTES_5, type Time12 } from '@/utils/time';
import type { Slot } from '@/types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SlotsPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const createSlotModal = useModal();
  const { slots, isLoading } = useAppSelector((s) => s.slots);

  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState<Time12>({ hour12: 9, minute: 0, period: 'AM' });
  const [end, setEnd] = useState<Time12>({ hour12: 10, minute: 0, period: 'AM' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSlots(undefined));
  }, [dispatch]);

  const grouped = useMemo(() => {
    const byDate: Record<string, Slot[]> = {};
    for (const s of slots) {
      (byDate[s.date] ||= []).push(s);
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        date,
        list: [...list].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [slots]);

  const handleCreate = async () => {
    const startTime = to24h(start);
    const endTime = to24h(end);
    if (!date) {
      toast.error('Missing fields', 'Date is required');
      return;
    }
    if (startTime >= endTime) {
      toast.error('Invalid range', 'End time must be after start time');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createSlot({ date, startTime, endTime })).unwrap();
      toast.success('Slot created', `${formatDateLabel(date)} ${format12h(startTime)}–${format12h(endTime)}`);
      createSlotModal.close();
    } catch (err) {
      toast.error('Could not create', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (slot: Slot) => {
    if (slot.status === 'booked') return;
    const next = slot.status === 'available' ? 'disabled' : 'available';
    try {
      await dispatch(updateSlotStatus({ id: slot.id, status: next })).unwrap();
      toast.success('Slot updated', `Marked ${next}`);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const handleDelete = async (slot: Slot) => {
    if (slot.status === 'booked') {
      toast.error('Cannot delete', 'A booked slot cannot be removed.');
      return;
    }
    try {
      await dispatch(deleteSlot(slot.id)).unwrap();
      toast.success('Slot deleted', `${formatDateLabel(slot.date)} ${format12h(slot.startTime)}–${format12h(slot.endTime)}`);
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  if (isLoading && slots.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Booking Slots</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Define daily windows that customers can book.</p>
        </motion.div>
        <Button onClick={createSlotModal.open} icon={<Plus className="h-4 w-4" />}>Create Slot</Button>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <CalendarDays className="w-10 h-10 text-[var(--text-tertiary)]/50 mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] text-sm">No slots yet. Create one to start accepting bookings.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, list }) => (
            <Card key={date}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{formatDateLabel(date)}</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">{list.length} slot{list.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((slot) => {
                  const variant = slot.status === 'available' ? 'success' : slot.status === 'booked' ? 'warning' : 'default';
                  const label = slot.status === 'available' ? 'Available' : slot.status === 'booked' ? 'Booked' : 'Disabled';
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{format12h(slot.startTime)} – {format12h(slot.endTime)}</p>
                          <Badge variant={variant}>{label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {slot.status !== 'booked' && (
                          <button
                            type="button"
                            title={slot.status === 'available' ? 'Disable' : 'Enable'}
                            onClick={() => handleToggle(slot)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                          >
                            {slot.status === 'available' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          title="Delete"
                          disabled={slot.status === 'booked'}
                          onClick={() => handleDelete(slot)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={createSlotModal.isOpen} onClose={createSlotModal.close} title="Create Slot">
        <div className="space-y-4">
          <Input
            id="slot-date"
            type="date"
            label="Date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          <TimePicker12h label="Start time" value={start} onChange={setStart} />
          <TimePicker12h label="End time" value={end} onChange={setEnd} />
          <p className="text-xs text-[var(--text-tertiary)]">
            Selected: {format12h(to24h(start))} – {format12h(to24h(end))}
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={createSlotModal.close} className="flex-1">Cancel</Button>
            <Button type="button" onClick={handleCreate} isLoading={submitting} className="flex-1">Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TimePicker12h({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Time12;
  onChange: (v: Time12) => void;
}) {
  const baseSelect =
    'flex-1 px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30';
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <select
          aria-label={`${label} hour`}
          className={baseSelect}
          value={value.hour12}
          onChange={(e) => onChange({ ...value, hour12: Number(e.target.value) })}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-[var(--text-tertiary)] font-medium">:</span>
        <select
          aria-label={`${label} minute`}
          className={baseSelect}
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: Number(e.target.value) })}
        >
          {MINUTES_5.map((m) => (
            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <div className="flex rounded-xl border border-[var(--border-color)] overflow-hidden">
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...value, period: p })}
              className={`px-3 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                value.period === p
                  ? 'bg-red-600 text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
