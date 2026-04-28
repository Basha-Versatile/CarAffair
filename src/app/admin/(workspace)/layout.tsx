import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import WorkspaceShell from './WorkspaceShell';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'admin' && user.role !== 'staff') {
    redirect(user.role === 'customer' ? '/me' : '/admin/login');
  }
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
