import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { User } from '@/models/User';
import { ApiError, apiError, signSession, setSessionCookie } from '@/lib/auth';
import { verifyLoginOtp } from '@/lib/otpStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code } = body ?? {};
    if (!phone || !code) throw new ApiError('Phone and code are required');
    const normalizedPhone = String(phone).trim();

    const result = verifyLoginOtp(normalizedPhone, String(code).trim());
    if (!result.ok) throw new ApiError(result.reason, 400);

    await connectDB();
    const customer = await Customer.findOne({ phone: normalizedPhone });
    if (!customer) throw new ApiError('Account not found', 404);
    const c = customer as unknown as { userId?: string };
    if (!c.userId) throw new ApiError('Account not found', 404);
    const user = await User.findById(c.userId);
    if (!user) throw new ApiError('Account not found', 404);
    const u = user as unknown as { _id: unknown; name: string; email: string; role: string; status: string };
    if (u.status !== 'active' || u.role !== 'customer') throw new ApiError('Account not active', 403);

    const sessionToken = await signSession({
      sub: String(u._id),
      email: u.email,
      name: u.name,
      role: 'customer',
    });

    const res = NextResponse.json({
      user: { id: String(u._id), name: u.name, email: u.email, role: 'customer' },
    });
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    return apiError(err);
  }
}
