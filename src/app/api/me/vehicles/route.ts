import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
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

    const docs = await Vehicle.find({ customerId: String(c._id) }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ vehicles: listJSON(docs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}
