'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, Phone, Mail, User, Car, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { format12h } from '@/utils/time';
import type { Slot } from '@/types';

type Step = 'slot' | 'details' | 'otp' | 'done';

interface DetailsForm {
  name: string;
  phone: string;
  email: string;
  registrationNumber: string;
  notes: string;
}

const initialDetails: DetailsForm = {
  name: '',
  phone: '',
  email: '',
  registrationNumber: '',
  notes: '',
};

const PHONE_RE = /^\+?\d{10,15}$/;

function formatDateLabel(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function BookPage() {
  const [step, setStep] = useState<Step>('slot');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [details, setDetails] = useState<DetailsForm>(initialDetails);
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; startTime: string; endTime: string; lookupError?: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    api
      .get<{ slots: Slot[] }>('/api/slots/available')
      .then((res) => {
        if (!cancelled) setSlots(res.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, Slot[]> = {};
    for (const s of slots) (grouped[s.date] ||= []).push(s);
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({ date, list: list.sort((a, b) => a.startTime.localeCompare(b.startTime)) }));
  }, [slots]);

  const sendOtp = async () => {
    if (!selectedSlot) return;
    if (!details.name.trim()) return setError('Please enter your name');
    if (!PHONE_RE.test(details.phone.trim())) return setError('Enter a valid phone number');
    if (!details.registrationNumber.trim()) return setError('Vehicle registration number is required');

    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; devCode?: string }>('/api/otp/send', {
        slotId: selectedSlot.id,
        name: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim() || undefined,
        registrationNumber: details.registrationNumber.trim(),
        notes: details.notes.trim() || undefined,
      });
      if (res.devCode) setDevCode(res.devCode);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code');
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; booking: { date: string; startTime: string; endTime: string }; lookupError?: string | null }>(
        '/api/otp/verify',
        { phone: details.phone.trim(), code: otp.trim() }
      );
      setConfirmed({
        date: res.booking.date,
        startTime: res.booking.startTime,
        endTime: res.booking.endTime,
        lookupError: res.lookupError,
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (!selectedSlot) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; devCode?: string }>('/api/otp/send', {
        slotId: selectedSlot.id,
        name: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim() || undefined,
        registrationNumber: details.registrationNumber.trim(),
        notes: details.notes.trim() || undefined,
      });
      if (res.devCode) setDevCode(res.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 sm:px-8 pt-10 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Book a service</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Pick a slot and we&apos;ll take it from there.</p>
          </div>
          <Link href="/" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</Link>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3 text-xs">
          {[
            { id: 'slot', label: 'Slot' },
            { id: 'details', label: 'Details' },
            { id: 'otp', label: 'Verify' },
            { id: 'done', label: 'Done' },
          ].map((s, i, arr) => {
            const order = arr.findIndex((x) => x.id === step);
            const active = arr.findIndex((x) => x.id === s.id) <= order;
            return (
              <div key={s.id} className="flex items-center gap-3 flex-1">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${active ? 'bg-red-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                  {i + 1}
                </div>
                <span className={active ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}>{s.label}</span>
                {i < arr.length - 1 && <div className={`flex-1 h-px ${active ? 'bg-red-600/40' : 'bg-[var(--border-color)]'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 'slot' && (
            <motion.div key="slot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CalendarDays className="h-4 w-4 text-red-500" /> Available slots
              </div>
              {loadingSlots ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full" />
                  ))}
                </div>
              ) : slotsByDate.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[var(--text-tertiary)]">No slots are open right now. Please call us or check back later.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {slotsByDate.map(({ date, list }) => (
                    <div key={date}>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{formatDateLabel(date)}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {list.map((slot) => {
                          const selected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`group relative px-4 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                                selected
                                  ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-red-500/50 hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                {format12h(slot.startTime)} – {format12h(slot.endTime)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => { setError(null); setStep('details'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'details' && selectedSlot && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-6 space-y-5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <CalendarDays className="h-4 w-4 text-red-500" />
                  {formatDateLabel(selectedSlot.date)} · {format12h(selectedSlot.startTime)} – {format12h(selectedSlot.endTime)}
                </div>
                <button type="button" onClick={() => setStep('slot')} className="text-xs text-red-500 hover:text-red-400">Change</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={<User className="h-4 w-4" />} label="Full name" value={details.name} onChange={(v) => setDetails({ ...details, name: v })} placeholder="Your name" />
                <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={details.phone} onChange={(v) => setDetails({ ...details, phone: v })} placeholder="+91 99999 99999" inputMode="tel" />
                <Field icon={<Mail className="h-4 w-4" />} label="Email (optional)" value={details.email} onChange={(v) => setDetails({ ...details, email: v })} placeholder="you@example.com" inputMode="email" />
                <Field icon={<Car className="h-4 w-4" />} label="Vehicle registration" value={details.registrationNumber} onChange={(v) => setDetails({ ...details, registrationNumber: v.toUpperCase() })} placeholder="KA-01-AB-1234" />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5" /> Anything else? (optional)
                </label>
                <textarea
                  value={details.notes}
                  onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  placeholder="Describe the issue or service you need…"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep('slot')} className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
                >
                  {submitting ? 'Sending OTP…' : <>Send OTP <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-6 space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Verify your number</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">We sent a 6-digit code to {details.phone}.</p>
              </div>

              {devCode && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
                  <strong>Dev mode:</strong> use code <span className="font-mono text-amber-300 text-sm">{devCode}</span>
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={verify}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
                >
                  {submitting ? 'Verifying…' : 'Confirm booking'}
                </button>
                <button type="button" onClick={resendOtp} disabled={submitting} className="text-xs text-[var(--text-tertiary)] hover:text-red-500">
                  Didn&apos;t get it? Resend code
                </button>
                <button type="button" onClick={() => setStep('details')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  Edit details
                </button>
              </div>
            </motion.div>
          )}

          {step === 'done' && confirmed && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Booking confirmed</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {formatDateLabel(confirmed.date)} · {format12h(confirmed.startTime)} – {format12h(confirmed.endTime)}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto">
                We&apos;ve saved your details and notified the workshop. You&apos;ll get a reminder before your slot.
              </p>
              {confirmed.lookupError && (
                <p className="text-xs text-amber-500 max-w-md mx-auto">
                  Note: vehicle lookup didn&apos;t complete ({confirmed.lookupError}). The workshop will fill in details on arrival.
                </p>
              )}
              <Link href="/" className="inline-block mt-2 text-sm font-medium text-red-500 hover:text-red-400">
                Back to home
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
        {icon} {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
      />
    </div>
  );
}
