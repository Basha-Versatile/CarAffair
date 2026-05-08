import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Customer } from '@/models/Customer';
import { ApiError, apiError } from '@/lib/auth';
import { generateOtp, isDevOtpExposureAllowed, setSignupOtp } from '@/lib/otpStore';

const PHONE_RE = /^\+?\d{10,15}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, password } = body ?? {};
    if (!name || String(name).trim().length < 2) throw new ApiError('Please enter your name');
    if (!phone || !PHONE_RE.test(String(phone).trim())) throw new ApiError('Valid phone number is required');
    if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters');

    const normalizedPhone = String(phone).trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;

    await connectDB();
    // If a User with this phone (or email) already exists with status 'active', block.
    const existingByEmail = normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null;
    if (existingByEmail) {
      const doc = existingByEmail as unknown as { status?: string };
      if (doc.status === 'active') throw new ApiError('An account with this email already exists. Please sign in.', 409);
    }
    // Phone match against the Customer collection (booking customers).
    const existingCustomerByPhone = await Customer.findOne({ phone: normalizedPhone });
    if (existingCustomerByPhone) {
      const c = existingCustomerByPhone as unknown as { userId?: string };
      if (c.userId) {
        const u = await User.findById(c.userId);
        const ud = u as unknown as { status?: string } | null;
        if (ud?.status === 'active') {
          throw new ApiError('An account already exists for this phone number. Please sign in.', 409);
        }
      }
    }

    const code = generateOtp();
    setSignupOtp(normalizedPhone, code, {
      name: String(name).trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      password: String(password),
    });

    console.log(`[OTP signup] phone=${normalizedPhone} code=${code} (expires in 5 min)`);

    const res: Record<string, unknown> = { ok: true };
    if (isDevOtpExposureAllowed()) res.devCode = code;
    return NextResponse.json(res);
  } catch (err) {
    return apiError(err);
  }
}
