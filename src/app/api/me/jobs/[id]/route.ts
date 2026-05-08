import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { Customer } from '@/models/Customer';
import { apiError, requireCustomer, ApiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';
import { stripCustomerJobView } from '@/lib/sanitize';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireCustomer();
    await connectDB();
    const customer = await Customer.findOne({ userId: me.sub });
    if (!customer) throw new ApiError('Customer record not found', 404);
    const c = customer as unknown as { _id: unknown };

    const { id } = await params;
    const job = await JobCard.findById(id);
    if (!job) throw new ApiError('Job not found', 404);
    const jd = job as unknown as { customerId: string };
    if (jd.customerId !== String(c._id)) throw new ApiError('Forbidden', 403);

    const jobCard = stripCustomerJobView(toJSON(job as never) as never);
    return NextResponse.json({ jobCard });
  } catch (err) {
    return apiError(err);
  }
}
