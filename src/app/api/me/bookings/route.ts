import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { Customer } from '@/models/Customer';
import { apiError, requireCustomer, ApiError } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';

export async function GET() {
  try {
    const me = await requireCustomer();
    await connectDB();
    const customer = await Customer.findOne({ userId: me.sub });
    if (!customer) throw new ApiError('Customer record not found', 404);
    const c = customer as unknown as { _id: unknown };

    const docs = await Booking.find({ customerId: String(c._id) })
      .sort({ date: -1, startTime: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ bookings: listJSON(docs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}
