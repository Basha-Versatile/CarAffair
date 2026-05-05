'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface InviteUser {
  name: string;
  email: string;
  role: string;
}

const roleLabel: Record<string, string> = {
  service_advisor: 'Service Advisor',
  mechanic: 'Mechanic',
  primary_technician: 'Primary Technician',
  admin: 'Admin',
  staff: 'Staff',
};

const homeForRole: Record<string, string> = {
  service_advisor: '/admin/job-cards',
  mechanic: '/admin/job-cards',
  primary_technician: '/admin/job-cards',
  admin: '/admin',
  staff: '/admin',
};

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;

  const [user, setUser] = useState<InviteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ user: InviteUser }>(`/api/invite/${token}`)
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Invite link is invalid');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    if (password.length < 6) return setSubmitError('Password must be at least 6 characters');
    if (password !== confirm) return setSubmitError('Passwords do not match');
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/invite/${token}`, { password });
      setDone(true);
      const next = user ? homeForRole[user.role] ?? '/admin' : '/admin';
      // Hard navigation so the new session cookie is picked up by the server-rendered
      // workspace layout, and the bundle reloads fresh.
      setTimeout(() => { window.location.assign(next); }, 800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not set password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <p className="text-sm text-[var(--text-tertiary)] animate-pulse">Validating invite…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Invite link unavailable</h1>
          <p className="text-[var(--text-tertiary)]">{loadError}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          {done ? (
            <div className="text-center space-y-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome aboard</h1>
              <p className="text-sm text-[var(--text-tertiary)]">Signing you in…</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set your password</h1>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Hi {user?.name}, you&apos;ve been invited as {user ? roleLabel[user.role] ?? user.role : ''}.
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">{user?.email}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                    <Lock className="h-3.5 w-3.5" /> New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2 mb-2">
                    <Lock className="h-3.5 w-3.5" /> Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
              </div>

              {submitError && <p className="text-sm text-red-500 text-center">{submitError}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
              >
                {submitting ? 'Saving…' : 'Set password & sign in'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
