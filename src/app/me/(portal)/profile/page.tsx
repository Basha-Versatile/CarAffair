'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface Profile { id: string; name: string; email: string; phone: string; address: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<{ profile: Profile }>('/api/me/profile')
      .then((res) => {
        if (cancelled) return;
        setProfile(res.profile);
        setName(res.profile.name);
        setEmail(res.profile.email);
        setAddress(res.profile.address);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const saveProfile = async () => {
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await api.patch('/api/me/profile', { name, email, address });
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not save' });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (newPassword.length < 6) return setPwMsg({ type: 'err', text: 'New password must be at least 6 characters' });
    if (newPassword !== confirmPassword) return setPwMsg({ type: 'err', text: 'Passwords do not match' });
    setSavingPassword(true);
    try {
      await api.patch('/api/me/profile', { currentPassword, newPassword });
      setPwMsg({ type: 'ok', text: 'Password changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>;
  if (!profile) return <p className="text-sm text-[var(--text-tertiary)]">Profile not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Update your contact details and password.</p>
      </motion.div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Personal details</h2>
        <Field icon={<User className="h-3.5 w-3.5" />} label="Full name" value={name} onChange={setName} />
        <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={email} onChange={setEmail} type="email" />
        <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={address} onChange={setAddress} />
        <div className="flex items-start gap-2">
          <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)] mt-1" />
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Phone</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{profile.phone}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Phone number can&apos;t be changed here. Contact us to update it.</p>
          </div>
        </div>
        {profileMsg && (
          <p className={`text-sm ${profileMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{profileMsg.text}</p>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600"
          >
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Change password</h2>
        <Field icon={<Lock className="h-3.5 w-3.5" />} label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
        <Field icon={<Lock className="h-3.5 w-3.5" />} label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Minimum 6 characters" />
        <Field icon={<Lock className="h-3.5 w-3.5" />} label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
        {pwMsg && (
          <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{pwMsg.text}</p>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={changePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50 cursor-pointer hover:from-red-500 hover:to-red-600"
          >
            {savingPassword ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon, label, value, onChange, type = 'text', placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
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
        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
      />
    </div>
  );
}
