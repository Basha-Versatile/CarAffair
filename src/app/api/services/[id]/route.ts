import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ServiceCatalogItem } from '@/models/Service';
import { ApiError, apiError, requireUser } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updated = await ServiceCatalogItem.findByIdAndUpdate(id, body, { new: true });
    if (!updated) throw new ApiError('Service not found', 404);
    return NextResponse.json({ service: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    await ServiceCatalogItem.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
