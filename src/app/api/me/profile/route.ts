import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Customer } from '@/models/Customer';
import { ApiError, apiError, hashPassword, requireCustomer, verifyPassword } from '@/lib/auth';

export async function GET() {
  try {
    const me = await requireCustomer();
    await connectDB();
    const user = await User.findById(me.sub);
    if (!user) throw new ApiError('Account not found', 404);
    const u = user as unknown as { _id: unknown; name: string; email: string };
    const customer = await Customer.findOne({ userId: me.sub });
    const c = customer as unknown as { name?: string; email?: string; phone?: string; address?: string } | null;
    return NextResponse.json({
      profile: {
        id: String(u._id),
        name: u.name,
        email: u.email,
        phone: c?.phone ?? '',
        address: c?.address ?? '',
      },
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await requireCustomer();
    const body = await req.json();
    const { name, email, address, currentPassword, newPassword } = body ?? {};
    await connectDB();

    const userUpdate: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) userUpdate.name = name.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new ApiError('Invalid email');
      userUpdate.email = normalized;
    }

    if (typeof newPassword === 'string' && newPassword) {
      if (newPassword.length < 6) throw new ApiError('Password must be at least 6 characters');
      const user = await User.findById(me.sub);
      if (!user) throw new ApiError('Account not found', 404);
      const u = user as unknown as { passwordHash?: string };
      if (!u.passwordHash) throw new ApiError('Account is not active');
      const ok = await verifyPassword(String(currentPassword ?? ''), u.passwordHash);
      if (!ok) throw new ApiError('Current password is incorrect', 400);
      userUpdate.passwordHash = await hashPassword(newPassword);
      userUpdate.passwordSetAt = new Date();
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(me.sub, userUpdate);
    }

    const customerUpdate: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) customerUpdate.name = name.trim();
    if (typeof email === 'string' && email.trim()) customerUpdate.email = email.trim().toLowerCase();
    if (typeof address === 'string') customerUpdate.address = address.trim() || '—';
    if (Object.keys(customerUpdate).length > 0) {
      await Customer.findOneAndUpdate({ userId: me.sub }, customerUpdate);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
