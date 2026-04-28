import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'caraffair_session';

type Role = 'admin' | 'staff' | 'customer';

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
  if (role === 'customer') return '/me';
  return '/';
}

const ADMIN_AUTH_PATHS = new Set(['/admin/login', '/admin/register']);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await readSession(token);
  const path = req.nextUrl.pathname;
  const isAdminAuthPath = ADMIN_AUTH_PATHS.has(path);

  // Already-signed-in users should not see the auth pages.
  if (isAdminAuthPath) {
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
    if (session.role !== 'admin' && session.role !== 'staff') {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(session.role);
      return NextResponse.redirect(url);
    }
  }

  // /me requires customer.
  if (path === '/me' || path.startsWith('/me/')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
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
