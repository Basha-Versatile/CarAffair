import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Alert } from '@/models/Notification';
import { ApiError, apiError, requireUser } from '@/lib/auth';

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') throw new ApiError('Forbidden', 403);
    await connectDB();
    const { id } = await params;
    await Alert.findByIdAndUpdate(id, { read: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
