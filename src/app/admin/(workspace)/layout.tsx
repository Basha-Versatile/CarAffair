import { redirect } from 'next/navigation';
import { getSessionUser, STAFF_ROLES } from '@/lib/auth';
import WorkspaceShell from './WorkspaceShell';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');
  if (!STAFF_ROLES.includes(user.role)) {
    redirect(user.role === 'customer' ? '/me' : '/admin/login');
  }
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
