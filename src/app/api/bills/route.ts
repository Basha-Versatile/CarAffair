import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/models/Bill';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const bills = await Bill.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ bills: listJSON(bills as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await Bill.create(body);
    return NextResponse.json({ bill: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
