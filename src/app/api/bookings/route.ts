import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') {
      return NextResponse.json({ bookings: [] });
    }
    await connectDB();
    const docs = await Booking.find().sort({ date: -1, startTime: -1 }).limit(200).lean();
    return NextResponse.json({ bookings: listJSON(docs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}
