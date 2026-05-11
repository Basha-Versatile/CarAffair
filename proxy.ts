import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'caraffair_session';

type Role =
  | 'admin'
  | 'staff'
  | 'customer'
  | 'service_advisor'
  | 'mechanic'
  | 'primary_technician';

const STAFF_ROLES: Role[] = ['admin', 'staff', 'service_advisor', 'mechanic', 'primary_technician'];

interface SessionPayload {
  sub?: string;
  role?: Role;
}

async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

function homeFor(role: Role | undefined): string {
  if (role === 'admin' || role === 'staff') return '/admin';
  if (role === 'service_advisor') return '/admin/job-cards';
  if (role === 'mechanic' || role === 'primary_technician') return '/admin/job-cards';
  if (role === 'customer') return '/me';
  return '/';
}

const ADMIN_AUTH_PATHS = new Set(['/admin/login']);
const CUSTOMER_AUTH_PATHS = new Set(['/me/login', '/me/sign-up']);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await readSession(token);
  const path = req.nextUrl.pathname;
  const isAdminAuthPath = ADMIN_AUTH_PATHS.has(path);
  const isCustomerAuthPath = CUSTOMER_AUTH_PATHS.has(path);

  // Already-signed-in users should not see auth pages — bounce them to their home.
  if (isAdminAuthPath || isCustomerAuthPath) {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(session.role);
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // /admin (workspace) requires admin or staff.
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
    if (!STAFF_ROLES.includes(session.role as Role)) {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(session.role);
      return NextResponse.redirect(url);
    }
  }

  // /me (customer portal) requires a customer session — anonymous visitors go
  // to /me/login, not /admin/login.
  if (path === '/me' || path.startsWith('/me/')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/me/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'customer') {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(session.role);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/me', '/me/:path*'],
};
