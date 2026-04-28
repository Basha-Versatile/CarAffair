// In-memory OTP store with 5-minute TTL.
// Replace with Redis or a Mongo TTL collection when scaling beyond a single Node process.

export interface PendingBookingPayload {
  slotId: string;
  name: string;
  phone: string;
  email?: string;
  registrationNumber: string;
  notes?: string;
}

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  payload: PendingBookingPayload;
}

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpEntry>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setOtp(phone: string, code: string, payload: PendingBookingPayload): void {
  store.set(phone, {
    code,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    payload,
  });
}

export function verifyOtp(
  phone: string,
  code: string
): { ok: true; payload: PendingBookingPayload } | { ok: false; reason: string } {
  const entry = store.get(phone);
  if (!entry) return { ok: false, reason: 'No OTP requested for this number. Please send a fresh OTP.' };
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return { ok: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return { ok: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    return { ok: false, reason: 'Incorrect OTP.' };
  }
  store.delete(phone);
  return { ok: true, payload: entry.payload };
}

export function isDevOtpExposureAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
