import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { ApiError, apiError, requireUser } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    const job = await JobCard.findById(id);
    if (!job) throw new ApiError('Job not found', 404);
    return NextResponse.json({ jobCard: toJSON(job as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updated = await JobCard.findByIdAndUpdate(id, body, { new: true });
    if (!updated) throw new ApiError('Job not found', 404);
    return NextResponse.json({ jobCard: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    await JobCard.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
