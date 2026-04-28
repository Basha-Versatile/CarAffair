import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ vehicles: listJSON(vehicles as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await Vehicle.create(body);
    return NextResponse.json({ vehicle: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
