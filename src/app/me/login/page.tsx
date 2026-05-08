'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

type Mode = 'password' | 'otp';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('otp');

  // password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // otp mode
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPassword = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/api/auth/login', { email, password });
      window.location.assign('/me');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; devCode?: string }>('/api/auth/customer/login-otp-send', { phone });
      setDevCode(res.devCode ?? null);
      setOtpStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/api/auth/customer/login-otp-verify', { phone, code });
      window.location.assign('/me');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sign in to your account</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Track your bookings, services, and vehicles.</p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => { setMode('otp'); setError(null); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === 'otp' ? 'bg-red-600 text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              OTP login
            </button>
            <button
              type="button"
              onClick={() => { setMode('password'); setError(null); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === 'password' ? 'bg-red-600 text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Password
            </button>
          </div>

          {mode === 'password' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button
                type="button"
                onClick={submitPassword}
                disabled={submitting || !email || !password}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          ) : otpStep === 'phone' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                  <Phone className="h-3.5 w-3.5" /> Phone number
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button
                type="button"
                onClick={sendOtp}
                disabled={submitting || !phone}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Sending OTP…' : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-[var(--text-tertiary)]">Enter the 6-digit code sent to {phone}.</p>
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
                onClick={verifyOtp}
                disabled={submitting || code.length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Verifying…' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpStep('phone'); setCode(''); setDevCode(null); }}
                className="w-full text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Use a different number
              </button>
            </div>
          )}

          <div className="text-center text-sm text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)]">
            New here?{' '}
            <Link href="/me/sign-up" className="text-red-500 hover:text-red-400 font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
