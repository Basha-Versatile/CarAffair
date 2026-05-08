import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import PortalShell from './PortalShell';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/me/login');
  if (user.role !== 'customer') {
    // Admin/staff/workforce should never be here.
    redirect('/admin');
  }
  return <PortalShell userName={user.name}>{children}</PortalShell>;
}
