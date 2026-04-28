import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ApiError, apiError, hashPassword, setSessionCookie, signSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body ?? {};
    if (!name || !email || !password) throw new ApiError('name, email and password are required');
    if (password.length < 6) throw new ApiError('Password must be at least 6 characters');

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new ApiError('An account with that email already exists', 409);

    const passwordHash = await hashPassword(password);
    const allowedRoles = ['admin', 'staff', 'customer'] as const;
    const resolvedRole = allowedRoles.includes(role) ? role : 'customer';
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: resolvedRole,
    });

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
