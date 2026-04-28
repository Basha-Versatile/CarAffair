import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ApiError, apiError, setSessionCookie, signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) ?? {};
    if (!email || !password) throw new ApiError('email and password are required');

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) throw new ApiError('Invalid credentials', 401);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new ApiError('Invalid credentials', 401);

    const token = await signSession({
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return apiError(err);
  }
}
