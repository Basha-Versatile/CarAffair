import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { User } from '@/models/User';
import { ApiError, apiError } from '@/lib/auth';
import { generateOtp, isDevOtpExposureAllowed, setLoginOtp } from '@/lib/otpStore';

const PHONE_RE = /^\+?\d{10,15}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body ?? {};
    if (!phone || !PHONE_RE.test(String(phone).trim())) throw new ApiError('Valid phone number is required');
    const normalizedPhone = String(phone).trim();

    await connectDB();
    // The phone must belong to a Customer with a linked active User.
    const customer = await Customer.findOne({ phone: normalizedPhone });
    if (!customer) throw new ApiError('No account found for this number. Please sign up.', 404);
    const c = customer as unknown as { userId?: string };
    if (!c.userId) throw new ApiError('No account found for this number. Please sign up.', 404);
    const user = await User.findById(c.userId);
    const u = user as unknown as { status?: string; role?: string } | null;
    if (!u || u.status !== 'active' || u.role !== 'customer') {
      throw new ApiError('No active account for this number.', 404);
    }

    const code = generateOtp();
    setLoginOtp(normalizedPhone, code);
    console.log(`[OTP login] phone=${normalizedPhone} code=${code} (expires in 5 min)`);

    const res: Record<string, unknown> = { ok: true };
    if (isDevOtpExposureAllowed()) res.devCode = code;
    return NextResponse.json(res);
  } catch (err) {
    return apiError(err);
  }
}
