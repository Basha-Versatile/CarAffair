import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { ApiError, apiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updated = await Notification.findByIdAndUpdate(id, body, { new: true });
    if (!updated) throw new ApiError('Notification not found', 404);
    return NextResponse.json({ notification: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}
