import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { ApiError, apiError, requireUser, ADMIN_ROLES } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';
import { isWorkforce, stripPricesList } from '@/lib/sanitize';

export async function GET() {
  try {
    const me = await requireUser();
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (me.role === 'service_advisor') filter.assignedAdvisorId = me.sub;
    else if (me.role === 'mechanic') filter.assignedMechanicId = me.sub;
    else if (me.role === 'primary_technician') filter.assignedTechnicianId = me.sub;

    const jobs = await JobCard.find(filter).sort({ createdAt: -1 }).lean();
    let result = listJSON(jobs as never[]);
    if (isWorkforce(me.role)) result = stripPricesList(result as never[]);
    return NextResponse.json({ jobCards: result });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (!ADMIN_ROLES.includes(me.role)) throw new ApiError('Forbidden', 403);
    await connectDB();
    const body = await req.json();
    const created = await JobCard.create(body);
    return NextResponse.json({ jobCard: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
