'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCcw, Mail, Copy, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, createUserThunk, resendInviteThunk, deleteUserThunk } from '@/features/users/usersSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useModal } from '@/hooks/useModal';
import { Skeleton, SkeletonHeader } from '@/components/ui/Skeleton';
import type { UserRole } from '@/types';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'service_advisor', label: 'Service Advisor' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'primary_technician', label: 'Primary Technician' },
];

const roleLabel = (r: UserRole) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const createModal = useModal();
  const { users, isLoading } = useAppSelector((s) => s.users);
  const me = useAppSelector((s) => s.auth.user);

  const [form, setForm] = useState<{ name: string; email: string; role: UserRole }>({
    name: '',
    email: '',
    role: 'service_advisor',
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers(undefined));
  }, [dispatch]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Missing fields', 'Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await dispatch(createUserThunk(form)).unwrap();
      toast.success('User invited', `${form.name} will receive a setup link`);
      if (res.devInviteUrl) setLastInviteUrl(res.devInviteUrl);
      setForm({ name: '', email: '', role: 'service_advisor' });
      createModal.close();
    } catch (err) {
      toast.error('Could not create', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string, name: string) => {
    try {
      const res = await dispatch(resendInviteThunk(id)).unwrap();
      toast.success('Invite resent', `New link generated for ${name}`);
      if (res.devInviteUrl) setLastInviteUrl(res.devInviteUrl);
    } catch (err) {
      toast.error('Resend failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === me?.id) {
      toast.error('Cannot delete', 'You cannot delete your own account.');
      return;
    }
    try {
      await dispatch(deleteUserThunk(id)).unwrap();
      toast.error('User removed', `${name} has been deleted`);
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{users.length} workforce account{users.length !== 1 ? 's' : ''}</p>
        </motion.div>
        <Button onClick={createModal.open} icon={<Plus className="h-4 w-4" />}>Create User</Button>
      </div>

      {lastInviteUrl && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <Mail className="h-4 w-4 text-amber-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">Dev mode: invite link</p>
            <p className="text-xs text-amber-300/80 mt-1 break-all font-mono">{lastInviteUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(lastInviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setLastInviteUrl(null)}
            className="px-2 text-xs text-amber-300/80 hover:text-amber-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {users.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-[var(--text-tertiary)] text-sm">No users yet. Invite a Service Advisor or Mechanic to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-6 py-4"><Badge variant="info">{roleLabel(u.role)}</Badge></td>
                    <td className="px-6 py-4">
                      <Badge variant={u.status === 'active' ? 'success' : 'warning'}>
                        {u.status === 'active' ? 'Active' : 'Invited'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === 'invited' && (
                          <button
                            type="button"
                            title="Resend invite"
                            onClick={() => handleResend(u.id, u.name)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Delete"
                          disabled={u.id === me?.id}
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Create User">
        <div className="space-y-4">
          <Input
            id="user-name"
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Doe"
          />
          <Input
            id="user-email"
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@caraffair.com"
          />
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            A password setup link will be generated. In dev it&apos;s shown above; in prod it goes by email.
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={createModal.close} className="flex-1">Cancel</Button>
            <Button type="button" onClick={handleCreate} isLoading={submitting} className="flex-1">Create &amp; Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
