'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/apiClient';

type Step = 'form' | 'otp' | 'done';

export default function CustomerSignUpPage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async () => {
    setError(null);
    if (!name.trim()) return setError('Please enter your name');
    if (!/^\+?\d{10,15}$/.test(phone.trim())) return setError('Enter a valid phone number');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; devCode?: string }>('/api/auth/customer/signup', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
      setDevCode(res.devCode ?? null);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code');
    setSubmitting(true);
    try {
      await api.post('/api/auth/customer/signup-verify', { phone: phone.trim(), code });
      setStep('done');
      setTimeout(() => { window.location.assign('/me'); }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          {step === 'done' ? (
            <div className="text-center space-y-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to Car Affair</h1>
              <p className="text-sm text-[var(--text-tertiary)]">Signing you in…</p>
            </div>
          ) : step === 'otp' ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Verify your number</h1>
                <p className="text-sm text-[var(--text-tertiary)]">We sent a 6-digit code to {phone}.</p>
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
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button
                type="button"
                onClick={verify}
                disabled={submitting || code.length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Verifying…' : 'Confirm & sign in'}
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Edit details
              </button>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                  <User className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
                <p className="text-sm text-[var(--text-tertiary)]">Track every service we do on your car.</p>
              </div>

              <div className="space-y-3">
                <Field icon={<User className="h-3.5 w-3.5" />} label="Full name" value={name} onChange={setName} placeholder="Your name" />
                <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={phone} onChange={setPhone} placeholder="+91 99999 99999" inputMode="tel" />
                <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email (optional)" value={email} onChange={setEmail} placeholder="you@example.com" inputMode="email" />
                <Field icon={<Lock className="h-3.5 w-3.5" />} label="Password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" type="password" />
                <Field icon={<Lock className="h-3.5 w-3.5" />} label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" type="password" />
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="button"
                onClick={submitForm}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Sending OTP…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </button>

              <div className="text-center text-sm text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)]">
                Already have an account?{' '}
                <Link href="/me/login" className="text-red-500 hover:text-red-400 font-medium">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  icon, label, value, onChange, placeholder, type = 'text', inputMode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
      />
    </div>
  );
}
