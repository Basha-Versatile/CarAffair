import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { apiError } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);
    const from = searchParams.get('from') ?? today;
    const to = searchParams.get('to');

    const filter: Record<string, unknown> = {
      status: 'available',
      date: { $gte: from },
    };
    if (to) (filter.date as Record<string, string>).$lte = to;

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 }).lean();
    return NextResponse.json({ slots: listJSON(slots as never[]) });
  } catch (err) {
    return apiError(err);
  }
}
