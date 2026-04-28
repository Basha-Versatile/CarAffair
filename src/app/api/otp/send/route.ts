import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { ApiError, apiError } from '@/lib/auth';
import { generateOtp, isDevOtpExposureAllowed, setOtp, type PendingBookingPayload } from '@/lib/otpStore';

const PHONE_RE = /^\+?\d{10,15}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slotId, name, phone, email, registrationNumber, notes } = body ?? {};

    if (!slotId) throw new ApiError('Slot is required');
    if (!name || String(name).trim().length < 2) throw new ApiError('Name is required');
    if (!phone || !PHONE_RE.test(String(phone))) throw new ApiError('Valid phone number is required');
    if (!registrationNumber || String(registrationNumber).trim().length < 4) {
      throw new ApiError('Registration number is required');
    }

    await connectDB();
    const slot = await Slot.findById(slotId);
    if (!slot) throw new ApiError('Slot not found', 404);
    const slotStatus = (slot as unknown as { status: string }).status;
    if (slotStatus !== 'available') throw new ApiError('Slot is no longer available', 409);

    const code = generateOtp();
    const payload: PendingBookingPayload = {
      slotId,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim().toLowerCase() : undefined,
      registrationNumber: String(registrationNumber).trim().toUpperCase(),
      notes: notes ? String(notes).trim() : undefined,
    };
    setOtp(payload.phone, code, payload);

    // Stub delivery: log to server console. Replace with SMS provider when available.
    console.log(`[OTP] phone=${payload.phone} code=${code} (expires in 5 min)`);

    const res: Record<string, unknown> = { ok: true };
    if (isDevOtpExposureAllowed()) res.devCode = code;
    return NextResponse.json(res);
  } catch (err) {
    return apiError(err);
  }
}
