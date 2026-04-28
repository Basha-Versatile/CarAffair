import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { ApiError, apiError, requireUser } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') throw new ApiError('Forbidden', 403);
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.status && ['available', 'disabled'].includes(body.status)) {
      const existing = await Slot.findById(id);
      if (!existing) throw new ApiError('Slot not found', 404);
      const status = (existing as unknown as { status: string }).status;
      if (status === 'booked') throw new ApiError('Cannot change status of a booked slot', 409);
      update.status = body.status;
    }
    const updated = await Slot.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError('Slot not found', 404);
    return NextResponse.json({ slot: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') throw new ApiError('Forbidden', 403);
    await connectDB();
    const { id } = await params;
    const slot = await Slot.findById(id);
    if (!slot) throw new ApiError('Slot not found', 404);
    if ((slot as unknown as { status: string }).status === 'booked') {
      throw new ApiError('Cannot delete a booked slot', 409);
    }
    await Slot.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
