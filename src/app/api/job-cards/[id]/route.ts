import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { Alert } from '@/models/Notification';
import { ApiError, apiError, requireUser, ADMIN_ROLES } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';
import { isWorkforce, stripPrices } from '@/lib/sanitize';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    await connectDB();
    const { id } = await params;
    const job = await JobCard.findById(id);
    if (!job) throw new ApiError('Job not found', 404);
    const jobDoc = job as unknown as {
      assignedAdvisorId?: string;
      assignedMechanicId?: string;
      assignedTechnicianId?: string;
    };
    if (me.role === 'service_advisor' && jobDoc.assignedAdvisorId !== me.sub) {
      throw new ApiError('Forbidden', 403);
    }
    if (me.role === 'mechanic' && jobDoc.assignedMechanicId !== me.sub) {
      throw new ApiError('Forbidden', 403);
    }
    if (me.role === 'primary_technician' && jobDoc.assignedTechnicianId !== me.sub) {
      throw new ApiError('Forbidden', 403);
    }
    let result = toJSON(job as never) as Record<string, unknown>;
    if (isWorkforce(me.role)) result = stripPrices(result as never);
    return NextResponse.json({ jobCard: result });
  } catch (err) {
    return apiError(err);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const existing = await JobCard.findById(id);
    if (!existing) throw new ApiError('Job not found', 404);
    const existingDoc = existing as unknown as {
      assignedAdvisorId?: string;
      status: string;
      customerName?: string;
      vehicleName?: string;
    };

    let update: Record<string, unknown> = body;
    const isAdmin = ADMIN_ROLES.includes(me.role);

    if (me.role === 'service_advisor') {
      if (existingDoc.assignedAdvisorId !== me.sub) throw new ApiError('Forbidden', 403);
      // Advisors can only update status + notes on their own jobs.
      const allowed: Record<string, unknown> = {};
      if (typeof body.status === 'string') allowed.status = body.status;
      if (typeof body.notes === 'string') allowed.notes = body.notes;
      update = allowed;
    } else if (me.role === 'mechanic' || me.role === 'primary_technician') {
      // Mechanics and primary technicians have read-only access to their assigned jobs.
      throw new ApiError('Forbidden — your role cannot modify jobs', 403);
    } else if (!isAdmin) {
      throw new ApiError('Forbidden', 403);
    }

    const updated = await JobCard.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError('Job not found', 404);

    // Emit alert to admins when an advisor changes the status.
    if (
      me.role === 'service_advisor' &&
      typeof body.status === 'string' &&
      body.status !== existingDoc.status
    ) {
      await Alert.create({
        type: 'status_updated',
        title: 'Job status updated',
        message: `${me.name} moved ${existingDoc.vehicleName ?? 'job'} to ${String(body.status).replace('_', ' ')}`,
        customerName: existingDoc.customerName ?? '',
        vehicleName: existingDoc.vehicleName,
        read: false,
      });
    }

    return NextResponse.json({ jobCard: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!ADMIN_ROLES.includes(me.role)) throw new ApiError('Forbidden', 403);
    await connectDB();
    const { id } = await params;
    await JobCard.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
