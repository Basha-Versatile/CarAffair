'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarPlus, Trash2, CalendarDays, Clock, Pause, Play, Plus, X, AlertTriangle, CheckCircle2, Eraser,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchSlots, updateSlotStatus, deleteSlot, scheduleSlots, clearDaySlots,
  type BulkScheduleResponse,
} from '@/features/slots/slotsSlice';
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

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
  // Monday as start of week.
  const d = new Date(`${iso}T00:00:00`);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function endOfWeek(iso: string): string {
  return shiftDate(startOfWeek(iso), 6);
}

function startOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function endOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const WEEKDAYS: { idx: number; label: string; short: string }[] = [
  { idx: 1, label: 'Monday', short: 'Mon' },
  { idx: 2, label: 'Tuesday', short: 'Tue' },
  { idx: 3, label: 'Wednesday', short: 'Wed' },
  { idx: 4, label: 'Thursday', short: 'Thu' },
  { idx: 5, label: 'Friday', short: 'Fri' },
  { idx: 6, label: 'Saturday', short: 'Sat' },
  { idx: 0, label: 'Sunday', short: 'Sun' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

interface Block {
  start: Time12;
  end: Time12;
}

function makeBlock(startHour: number, durationMin: number): Block {
  const startMinutes = startHour * 60;
  const endMinutes = startMinutes + durationMin;
  const sH = Math.floor(startMinutes / 60);
  const eH = Math.floor(endMinutes / 60);
  return {
    start: { hour12: ((sH + 11) % 12) + 1, minute: startMinutes % 60, period: sH >= 12 ? 'PM' : 'AM' },
    end: { hour12: ((eH + 11) % 12) + 1, minute: endMinutes % 60, period: eH >= 12 ? 'PM' : 'AM' },
  };
}

function countDates(from: string, to: string, weekdays: Set<number>): number {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let n = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (weekdays.has(cursor.getDay())) n++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return n;
}

export default function SlotsPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const scheduleModal = useModal();
  const { slots, isLoading } = useAppSelector((s) => s.slots);

  // ── Bulk schedule form state ──
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(endOfWeek(todayISO()));
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
  const [blocks, setBlocks] = useState<Block[]>([makeBlock(9, 60), makeBlock(10, 60)]);
  const [autoStart, setAutoStart] = useState<Time12>({ hour12: 9, minute: 0, period: 'AM' });
  const [autoEnd, setAutoEnd] = useState<Time12>({ hour12: 6, minute: 0, period: 'PM' });
  const [autoDuration, setAutoDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkScheduleResponse | null>(null);

  useEffect(() => {
    dispatch(fetchSlots(undefined));
  }, [dispatch]);

  const grouped = useMemo(() => {
    const byDate: Record<string, Slot[]> = {};
    for (const s of slots) (byDate[s.date] ||= []).push(s);
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, list]) => ({
        date: d,
        list: [...list].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [slots]);

  const totalGenerated = useMemo(
    () => countDates(from, to, weekdays) * blocks.length,
    [from, to, weekdays, blocks.length]
  );

  const resetSchedule = () => {
    setFrom(todayISO());
    setTo(endOfWeek(todayISO()));
    setWeekdays(new Set([1, 2, 3, 4, 5, 6]));
    setBlocks([makeBlock(9, 60), makeBlock(10, 60)]);
    setResult(null);
  };

  const openSchedule = () => {
    resetSchedule();
    scheduleModal.open();
  };

  const closeSchedule = () => {
    scheduleModal.close();
    setResult(null);
  };

  // ── Quick range presets ──
  const today = todayISO();
  // Clamp `from` to today so presets never schedule into the past.
  const setRange = (fromIso: string, toIso: string) => {
    const safeFrom = fromIso < today ? today : fromIso;
    setFrom(safeFrom);
    setTo(toIso);
  };
  const presetThisWeek = () => setRange(startOfWeek(today), endOfWeek(today));
  const presetNextWeek = () => {
    const nextStart = shiftDate(startOfWeek(today), 7);
    setRange(nextStart, shiftDate(nextStart, 6));
  };
  const presetThisMonth = () => setRange(startOfMonth(today), endOfMonth(today));
  const presetNextMonth = () => {
    const nm = new Date(`${today}T00:00:00`);
    nm.setMonth(nm.getMonth() + 1);
    const nmIso = nm.toISOString().slice(0, 10);
    setRange(startOfMonth(nmIso), endOfMonth(nmIso));
  };

  // ── Weekday helpers ──
  const toggleWeekday = (idx: number) => {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  const setWeekdaysOnly = () => setWeekdays(new Set([1, 2, 3, 4, 5]));
  const setAllDays = () => setWeekdays(new Set([0, 1, 2, 3, 4, 5, 6]));
  const clearDays = () => setWeekdays(new Set());

  // ── Block helpers ──
  const addBlock = () => setBlocks((prev) => [...prev, makeBlock(9 + prev.length, 60)]);
  const removeBlock = (i: number) => setBlocks((prev) => prev.filter((_, j) => j !== i));
  const updateBlock = (i: number, key: 'start' | 'end', value: Time12) => {
    setBlocks((prev) => prev.map((b, j) => (j === i ? { ...b, [key]: value } : b)));
  };

  const generateBlocks = () => {
    const startMin = (() => {
      let h = autoStart.hour12 % 12;
      if (autoStart.period === 'PM') h += 12;
      return h * 60 + autoStart.minute;
    })();
    const endMin = (() => {
      let h = autoEnd.hour12 % 12;
      if (autoEnd.period === 'PM') h += 12;
      return h * 60 + autoEnd.minute;
    })();
    if (startMin >= endMin) {
      toast.error('Invalid shift', 'Shift end must be after start.');
      return;
    }
    const out: Block[] = [];
    for (let m = startMin; m + autoDuration <= endMin; m += autoDuration) {
      out.push(makeBlock(0, 0)); // placeholder, overwritten below
      const idx = out.length - 1;
      const sH = Math.floor(m / 60);
      const sM = m % 60;
      const e = m + autoDuration;
      const eH = Math.floor(e / 60);
      const eM = e % 60;
      out[idx] = {
        start: { hour12: ((sH + 11) % 12) + 1, minute: sM, period: sH >= 12 ? 'PM' : 'AM' },
        end: { hour12: ((eH + 11) % 12) + 1, minute: eM, period: eH >= 12 ? 'PM' : 'AM' },
      };
    }
    if (out.length === 0) {
      toast.error('No blocks fit', 'The duration is larger than the shift window.');
      return;
    }
    setBlocks(out);
    toast.success('Generated', `${out.length} time block${out.length !== 1 ? 's' : ''}`);
  };

  // ── Submit ──
  const handleSchedule = async () => {
    if (from > to) {
      toast.error('Invalid range', '"From" date is after "To" date.');
      return;
    }
    if (weekdays.size === 0) {
      toast.error('No working days', 'Pick at least one day of the week.');
      return;
    }
    if (blocks.length === 0) {
      toast.error('No time blocks', 'Add at least one time block.');
      return;
    }
    // Validate each block locally before submission.
    for (const b of blocks) {
      const s = to24h(b.start);
      const e = to24h(b.end);
      if (s >= e) {
        toast.error('Invalid block', `${format12h(s)} – ${format12h(e)} is not valid.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await dispatch(scheduleSlots({
        from,
        to,
        weekdays: Array.from(weekdays),
        blocks: blocks.map((b) => ({ startTime: to24h(b.start), endTime: to24h(b.end) })),
      })).unwrap();
      setResult(res);
      if (res.created > 0) {
        toast.success('Slots scheduled', `${res.created} slot${res.created !== 1 ? 's' : ''} created.`);
      } else {
        toast.info('Nothing created', 'All proposed slots conflicted with existing ones.');
      }
    } catch (err) {
      toast.error('Schedule failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Single-slot maintenance (existing affordances) ──
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

  const handleClearDay = async (date: string) => {
    if (!confirm(`Delete all unbooked slots for ${formatDateLabel(date)}?`)) return;
    try {
      const res = await dispatch(clearDaySlots(date)).unwrap();
      if (res.deletedIds.length === 0) {
        toast.info('Nothing to clear', 'Only booked slots remain on this day.');
      } else {
        toast.success('Day cleared', `${res.deletedIds.length} slot${res.deletedIds.length !== 1 ? 's' : ''} removed.`);
      }
    } catch (err) {
      toast.error('Clear failed', err instanceof Error ? err.message : 'Try again');
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
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Schedule slots for a day, a week, or a whole month in one go.</p>
        </motion.div>
        <Button onClick={openSchedule} icon={<CalendarPlus className="h-4 w-4" />}>Schedule Slots</Button>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <CalendarDays className="w-10 h-10 text-[var(--text-tertiary)]/50 mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] text-sm">No slots yet. Click <span className="text-[var(--text-primary)] font-medium">Schedule Slots</span> to set up a day, week, or month at once.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, list }) => {
            const removable = list.filter((s) => s.status !== 'booked').length;
            return (
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
                  {removable > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearDay(date)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete all unbooked slots for this day"
                    >
                      <Eraser className="h-3.5 w-3.5" /> Clear day
                    </button>
                  )}
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
            );
          })}
        </div>
      )}

      <Modal isOpen={scheduleModal.isOpen} onClose={closeSchedule} title={result ? 'Schedule Result' : 'Schedule Slots'} size="lg">
        {result ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Created {result.created} slot{result.created !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-emerald-300/80 mt-0.5">They are now visible to customers as available bookings.</p>
              </div>
            </div>
            {result.skipped.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">
                      Skipped {result.skipped.length} slot{result.skipped.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-300/80 mt-0.5">These conflicted with slots that already exist on those days.</p>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {result.skipped.map((s, i) => (
                    <div key={i} className="text-xs text-amber-300/90 flex items-center justify-between bg-amber-500/5 rounded-lg px-3 py-1.5">
                      <span>{formatDateLabel(s.date)}</span>
                      <span className="font-mono">{format12h(s.startTime)} – {format12h(s.endTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setResult(null)} className="flex-1">Schedule More</Button>
              <Button type="button" onClick={closeSchedule} className="flex-1">Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Date Range ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Date Range</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'This week', fn: presetThisWeek },
                  { label: 'Next week', fn: presetNextWeek },
                  { label: 'This month', fn: presetThisMonth },
                  { label: 'Next month', fn: presetNextMonth },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={p.fn}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-red-500/40 transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input id="bulk-from" type="date" label="From" value={from} min={today} onChange={(e) => setFrom(e.target.value)} />
                <Input id="bulk-to" type="date" label="To" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            {/* ── Working days ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Working Days</label>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={setWeekdaysOnly} className="text-red-500 hover:text-red-400 cursor-pointer">Weekdays only</button>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <button type="button" onClick={setAllDays} className="text-red-500 hover:text-red-400 cursor-pointer">All days</button>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <button type="button" onClick={clearDays} className="text-red-500 hover:text-red-400 cursor-pointer">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((w) => {
                  const checked = weekdays.has(w.idx);
                  return (
                    <button
                      key={w.idx}
                      type="button"
                      onClick={() => toggleWeekday(w.idx)}
                      className={`px-2 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        checked
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 border border-red-600'
                          : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-red-500/40'
                      }`}
                      title={w.label}
                    >
                      {w.short}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">Unchecked days are treated as non-working — no slots will be created for them.</p>
            </div>

            {/* ── Auto-divide ── */}
            <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Auto-divide a shift (optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TimePicker12h label="Shift start" value={autoStart} onChange={setAutoStart} />
                <TimePicker12h label="Shift end" value={autoEnd} onChange={setAutoEnd} />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Slot duration</label>
                  <select
                    value={autoDuration}
                    onChange={(e) => setAutoDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="secondary" onClick={generateBlocks}>Generate blocks</Button>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">Replaces the time blocks below with one row per slot in the shift.</p>
            </div>

            {/* ── Time blocks ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Time Blocks per day</label>
                <button type="button" onClick={addBlock} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add block
                </button>
              </div>
              {blocks.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  No time blocks. Add one or use Auto-divide above.
                </p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <TimePicker12h label="Start" value={b.start} onChange={(v) => updateBlock(i, 'start', v)} compact />
                        <TimePicker12h label="End" value={b.end} onChange={(v) => updateBlock(i, 'end', v)} compact />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlock(i)}
                        className="mt-6 p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer"
                        title="Remove block"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Summary ── */}
            <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                This will create{' '}
                <span className="font-bold text-[var(--text-primary)]">{totalGenerated}</span>{' '}
                slot{totalGenerated !== 1 ? 's' : ''}{' '}
                <span className="text-[var(--text-tertiary)]">
                  ({countDates(from, to, weekdays)} day{countDates(from, to, weekdays) !== 1 ? 's' : ''} × {blocks.length} block{blocks.length !== 1 ? 's' : ''}/day)
                </span>
                .
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Conflicts with existing slots on the same date will be skipped automatically.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeSchedule} className="flex-1">Cancel</Button>
              <Button
                type="button"
                onClick={handleSchedule}
                isLoading={submitting}
                disabled={totalGenerated === 0}
                className="flex-1"
              >
                Schedule {totalGenerated > 0 ? `${totalGenerated} slot${totalGenerated !== 1 ? 's' : ''}` : 'Slots'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TimePicker12h({
  label,
  value,
  onChange,
  compact,
}: {
  label: string;
  value: Time12;
  onChange: (v: Time12) => void;
  compact?: boolean;
}) {
  const baseSelect = `${compact ? 'px-2 py-2' : 'px-3 py-2.5'} flex-1 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30`;
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{label}</label>
      <div className="flex items-center gap-1.5">
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
              className={`${compact ? 'px-2 py-2' : 'px-3 py-2.5'} text-xs font-semibold cursor-pointer transition-colors ${
                value.period === p
                  ? 'bg-red-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
