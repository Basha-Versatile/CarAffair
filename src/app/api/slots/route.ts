import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { ApiError, apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;
    else if (from || to) {
      filter.date = {} as Record<string, string>;
      if (from) (filter.date as Record<string, string>).$gte = from;
      if (to) (filter.date as Record<string, string>).$lte = to;
    }

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 }).lean();
    return NextResponse.json({ slots: listJSON(slots as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') throw new ApiError('Forbidden', 403);
    await connectDB();
    const body = await req.json();
    const { date, startTime, endTime } = body ?? {};

    if (!DATE_RE.test(String(date ?? ''))) throw new ApiError('Invalid date');
    if (!TIME_RE.test(String(startTime ?? '')) || !TIME_RE.test(String(endTime ?? ''))) {
      throw new ApiError('Invalid time');
    }
    if (startTime >= endTime) throw new ApiError('End time must be after start time');

    const overlap = await Slot.findOne({
      date,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    });
    if (overlap) throw new ApiError('Slot overlaps an existing slot for this date', 409);

    const created = await Slot.create({
      date,
      startTime,
      endTime,
      status: 'available',
    });
    return NextResponse.json({ slot: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
