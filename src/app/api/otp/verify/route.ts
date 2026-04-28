import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { Booking } from '@/models/Booking';
import { Customer } from '@/models/Customer';
import { Vehicle } from '@/models/Vehicle';
import { Alert } from '@/models/Notification';
import { ApiError, apiError } from '@/lib/auth';
import { verifyOtp } from '@/lib/otpStore';
import { lookupVehicleByRegistration, SurepassLookupError } from '@/services/surepassService';
import { toJSON } from '@/lib/serialize';
import { format12h } from '@/utils/time';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code } = body ?? {};
    if (!phone || !code) throw new ApiError('Phone and code are required');

    const result = verifyOtp(String(phone).trim(), String(code).trim());
    if (!result.ok) throw new ApiError(result.reason, 400);

    const payload = result.payload;
    await connectDB();

    // Atomically claim the slot so two simultaneous bookings can't both succeed.
    const claimed = await Slot.findOneAndUpdate(
      { _id: payload.slotId, status: 'available' },
      { status: 'booked' },
      { new: true }
    );
    if (!claimed) throw new ApiError('Slot is no longer available', 409);

    let customer = await Customer.findOne({ phone: payload.phone });
    if (!customer) {
      customer = await Customer.create({
        name: payload.name,
        email: payload.email ?? `${payload.phone}@guest.caraffair.local`,
        phone: payload.phone,
        address: '—',
      });
    }
    const customerId = String((customer as unknown as { _id: unknown })._id);

    // Surepass lookup is best-effort. On failure we still create a placeholder vehicle
    // so the admin can complete details later.
    let lookup: Awaited<ReturnType<typeof lookupVehicleByRegistration>> | null = null;
    let lookupError: string | null = null;
    try {
      lookup = await lookupVehicleByRegistration(payload.registrationNumber);
    } catch (err) {
      lookupError = err instanceof SurepassLookupError ? err.message : 'Lookup failed';
    }

    const vehicle = await Vehicle.create({
      customerId,
      make: lookup?.make ?? 'Unknown',
      model: lookup?.model ?? 'Unknown',
      year: lookup?.year ?? new Date().getFullYear(),
      color: lookup?.color ?? '—',
      licensePlate: payload.registrationNumber,
      vin: lookup?.vin ?? '—',
      mileage: lookup?.mileage ?? 0,
      engineNumber: lookup?.engineNumber,
      chassisNumber: lookup?.chassisNumber,
    });
    const vehicleId = String((vehicle as unknown as { _id: unknown })._id);
    const vehicleSummary = lookup ? `${lookup.make} ${lookup.model}` : payload.registrationNumber;

    const slotData = claimed as unknown as { date: string; startTime: string; endTime: string };
    const booking = await Booking.create({
      slotId: payload.slotId,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      customerId,
      customerName: payload.name,
      phone: payload.phone,
      email: payload.email,
      vehicleId,
      registrationNumber: payload.registrationNumber,
      vehicleSummary,
      notes: payload.notes,
      status: 'confirmed',
    });
    const bookingId = String((booking as unknown as { _id: unknown })._id);

    await Slot.findByIdAndUpdate(payload.slotId, { bookingId });

    await Alert.create({
      type: 'booking_created',
      title: 'New booking',
      message: `${payload.name} booked ${slotData.date} ${format12h(slotData.startTime)}–${format12h(slotData.endTime)} for ${vehicleSummary}`,
      customerName: payload.name,
      vehicleName: vehicleSummary,
      read: false,
    });

    return NextResponse.json({
      ok: true,
      booking: toJSON(booking as never),
      lookupError,
    });
  } catch (err) {
    return apiError(err);
  }
}
