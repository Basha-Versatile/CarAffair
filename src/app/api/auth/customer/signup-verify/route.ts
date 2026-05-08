import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Customer } from '@/models/Customer';
import { Alert } from '@/models/Notification';
import { ApiError, apiError, hashPassword, signSession, setSessionCookie } from '@/lib/auth';
import { verifySignupOtp } from '@/lib/otpStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code } = body ?? {};
    if (!phone || !code) throw new ApiError('Phone and code are required');

    const result = verifySignupOtp(String(phone).trim(), String(code).trim());
    if (!result.ok) throw new ApiError(result.reason, 400);

    const payload = result.payload;
    await connectDB();

    // Find or create the Customer record (a booking may have already created one).
    let customer = await Customer.findOne({ phone: payload.phone });
    if (!customer) {
      customer = await Customer.create({
        name: payload.name,
        email: payload.email ?? `${payload.phone}@guest.caraffair.local`,
        phone: payload.phone,
        address: '—',
      });
    }
    const customerDoc = customer as unknown as { _id: unknown; userId?: string };

    // Create or upgrade the User row.
    const passwordHash = await hashPassword(payload.password);
    const userEmail = payload.email ?? `${payload.phone}@guest.caraffair.local`;

    let user = await User.findOne({ email: userEmail });
    if (!user && customerDoc.userId) {
      user = await User.findById(customerDoc.userId);
    }
    if (user) {
      const userDoc = user as unknown as { _id: unknown; status?: string };
      if (userDoc.status === 'active') {
        throw new ApiError('An account already exists. Please sign in.', 409);
      }
      await User.findByIdAndUpdate(userDoc._id, {
        name: payload.name,
        passwordHash,
        status: 'active',
        passwordSetAt: new Date(),
        $unset: { inviteToken: '', inviteExpiresAt: '' },
      });
      user = await User.findById(userDoc._id);
    } else {
      user = await User.create({
        name: payload.name,
        email: userEmail,
        passwordHash,
        role: 'customer',
        status: 'active',
        passwordSetAt: new Date(),
      });
    }
    const userDoc = user as unknown as { _id: unknown; name: string; email: string; role: string };

    // Link the Customer to the User if not already.
    if (!customerDoc.userId) {
      await Customer.findByIdAndUpdate(customerDoc._id, { userId: String(userDoc._id) });
    }

    // Admin alert
    await Alert.create({
      type: 'customer_signed_up',
      title: 'New customer signed up',
      message: `${payload.name} (${payload.phone}) created an account`,
      customerName: payload.name,
      read: false,
    });

    const sessionToken = await signSession({
      sub: String(userDoc._id),
      email: userDoc.email,
      name: userDoc.name,
      role: 'customer',
    });

    const res = NextResponse.json({
      user: {
        id: String(userDoc._id),
        name: userDoc.name,
        email: userDoc.email,
        role: 'customer',
      },
    });
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    return apiError(err);
  }
}
