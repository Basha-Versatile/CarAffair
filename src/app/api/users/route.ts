import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';
import { randomBytes } from 'crypto';

const ASSIGNABLE_ROLES = ['service_advisor', 'mechanic', 'primary_technician'];
const WORKFORCE_ROLES = ['service_advisor', 'mechanic', 'primary_technician'];
const INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function publicUser(doc: Record<string, unknown>) {
  const { passwordHash: _ph, inviteToken: _it, ...rest } = doc as { passwordHash?: unknown; inviteToken?: unknown };
  void _ph;
  void _it;
  return rest;
}

export async function GET(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    // Default: only workforce users (Service Advisor, Mechanic, Primary Technician).
    // An explicit ?role= query overrides — but it must still be one of the workforce roles.
    const filter: Record<string, unknown> =
      role && WORKFORCE_ROLES.includes(role)
        ? { role }
        : { role: { $in: WORKFORCE_ROLES } };
    const docs = await User.find(filter).sort({ createdAt: -1 }).lean();
    const users = (listJSON(docs as never[]) as Record<string, unknown>[]).map(publicUser);
    return NextResponse.json({ users });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const body = await req.json();
    const { name, email, role } = body ?? {};

    if (!name || String(name).trim().length < 2) throw new ApiError('Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) throw new ApiError('Valid email is required');
    if (!ASSIGNABLE_ROLES.includes(role)) throw new ApiError('Invalid role');

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw new ApiError('A user with this email already exists', 409);

    const inviteToken = randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const created = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      role,
      status: 'invited',
      inviteToken,
      inviteExpiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;
    console.log(`[INVITE] email=${normalizedEmail} url=${inviteUrl} (expires ${inviteExpiresAt.toISOString()})`);

    const res: Record<string, unknown> = {
      user: publicUser(toJSON(created as never) as Record<string, unknown>),
    };
    if (process.env.NODE_ENV !== 'production') res.devInviteUrl = inviteUrl;
    return NextResponse.json(res);
  } catch (err) {
    return apiError(err);
  }
}
