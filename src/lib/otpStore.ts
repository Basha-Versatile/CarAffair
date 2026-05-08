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

export interface PendingCustomerSignup {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface PendingCustomerLogin {
  phone: string;
}

interface OtpEntry<P = unknown> {
  code: string;
  expiresAt: number;
  attempts: number;
  payload: P;
}

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpEntry>();

function key(kind: string, phone: string) {
  return `${kind}:${phone}`;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Booking OTP (existing) ──
export function setOtp(phone: string, code: string, payload: PendingBookingPayload): void {
  store.set(key('booking', phone), {
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
  return verifyKindedOtp<PendingBookingPayload>('booking', phone, code);
}

// ── Customer signup OTP ──
export function setSignupOtp(phone: string, code: string, payload: PendingCustomerSignup): void {
  store.set(key('signup', phone), {
    code,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    payload,
  });
}

export function verifySignupOtp(
  phone: string,
  code: string
): { ok: true; payload: PendingCustomerSignup } | { ok: false; reason: string } {
  return verifyKindedOtp<PendingCustomerSignup>('signup', phone, code);
}

// ── Customer login OTP ──
export function setLoginOtp(phone: string, code: string): void {
  store.set(key('login', phone), {
    code,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    payload: { phone } as PendingCustomerLogin,
  });
}

export function verifyLoginOtp(
  phone: string,
  code: string
): { ok: true } | { ok: false; reason: string } {
  const result = verifyKindedOtp<PendingCustomerLogin>('login', phone, code);
  if (!result.ok) return result;
  return { ok: true };
}

function verifyKindedOtp<P>(
  kind: string,
  phone: string,
  code: string
): { ok: true; payload: P } | { ok: false; reason: string } {
  const k = key(kind, phone);
  const entry = store.get(k) as OtpEntry<P> | undefined;
  if (!entry) return { ok: false, reason: 'No OTP requested for this number. Please send a fresh OTP.' };
  if (Date.now() > entry.expiresAt) {
    store.delete(k);
    return { ok: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(k);
    return { ok: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    return { ok: false, reason: 'Incorrect OTP.' };
  }
  store.delete(k);
  return { ok: true, payload: entry.payload };
}

export function isDevOtpExposureAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
