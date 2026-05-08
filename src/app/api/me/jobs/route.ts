import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { Customer } from '@/models/Customer';
import { apiError, requireCustomer, ApiError } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';
import { stripCustomerJobViewList } from '@/lib/sanitize';

export async function GET() {
  try {
    const me = await requireCustomer();
    await connectDB();
    const customer = await Customer.findOne({ userId: me.sub });
    if (!customer) throw new ApiError('Customer record not found', 404);
    const c = customer as unknown as { _id: unknown };

    const docs = await JobCard.find({ customerId: String(c._id) })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const jobCards = stripCustomerJobViewList(listJSON(docs as never[]) as never[]);
    return NextResponse.json({ jobCards });
  } catch (err) {
    return apiError(err);
  }
}
