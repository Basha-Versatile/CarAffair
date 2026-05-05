import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';
import { randomBytes } from 'crypto';

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const ASSIGNABLE_ROLES = ['service_advisor', 'mechanic', 'primary_technician'];

function publicUser(doc: Record<string, unknown>) {
  const { passwordHash: _ph, inviteToken: _it, ...rest } = doc as { passwordHash?: unknown; inviteToken?: unknown };
  void _ph;
  void _it;
  return rest;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.name) update.name = String(body.name).trim();
    if (body.role) {
      if (!ASSIGNABLE_ROLES.includes(body.role)) throw new ApiError('Invalid role');
      update.role = body.role;
    }
    const updated = await User.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError('User not found', 404);
    return NextResponse.json({ user: publicUser(toJSON(updated as never) as Record<string, unknown>) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Resend invite: regenerate token and extend expiry.
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    if (searchParams.get('action') !== 'resend-invite') throw new ApiError('Unknown action');

    const inviteToken = randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const updated = await User.findByIdAndUpdate(
      id,
      { status: 'invited', inviteToken, inviteExpiresAt },
      { new: true }
    );
    if (!updated) throw new ApiError('User not found', 404);

    const userDoc = updated as unknown as { email: string };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;
    console.log(`[INVITE] email=${userDoc.email} url=${inviteUrl} (resend)`);

    const res: Record<string, unknown> = {
      user: publicUser(toJSON(updated as never) as Record<string, unknown>),
    };
    if (process.env.NODE_ENV !== 'production') res.devInviteUrl = inviteUrl;
    return NextResponse.json(res);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    if (id === me.sub) throw new ApiError('You cannot delete your own account', 400);
    await User.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
