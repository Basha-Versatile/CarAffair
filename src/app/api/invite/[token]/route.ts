import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ApiError, apiError, hashPassword, signSession, setSessionCookie } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const user = (await User.findOne({ inviteToken: token })) as unknown as
      | { _id: unknown; name: string; email: string; role: string; status: string; inviteExpiresAt?: Date }
      | null;
    if (!user) throw new ApiError('Invite link is invalid', 404);
    if (user.status !== 'invited') throw new ApiError('This invite has already been used', 410);
    if (user.inviteExpiresAt && new Date(user.inviteExpiresAt).getTime() < Date.now()) {
      throw new ApiError('Invite link has expired. Ask your admin to resend.', 410);
    }
    return NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const body = await req.json();
    const { password } = body ?? {};
    if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters');

    const user = await User.findOne({ inviteToken: token });
    if (!user) throw new ApiError('Invite link is invalid', 404);
    const userDoc = user as unknown as { _id: unknown; status: string; inviteExpiresAt?: Date; email: string; name: string; role: string };
    if (userDoc.status !== 'invited') throw new ApiError('This invite has already been used', 410);
    if (userDoc.inviteExpiresAt && new Date(userDoc.inviteExpiresAt).getTime() < Date.now()) {
      throw new ApiError('Invite link has expired. Ask your admin to resend.', 410);
    }

    const passwordHash = await hashPassword(String(password));
    await User.findByIdAndUpdate(userDoc._id, {
      passwordHash,
      status: 'active',
      passwordSetAt: new Date(),
      $unset: { inviteToken: '', inviteExpiresAt: '' },
    });

    const sessionToken = await signSession({
      sub: String(userDoc._id),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role as 'service_advisor' | 'mechanic' | 'primary_technician' | 'admin' | 'staff',
    });

    const res = NextResponse.json({
      user: {
        id: String(userDoc._id),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
      },
    });
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    return apiError(err);
  }
}
