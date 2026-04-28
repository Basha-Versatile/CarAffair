import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { Vehicle } from '@/models/Vehicle';
import { ApiError, apiError, requireUser } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updated = await Customer.findByIdAndUpdate(
      id,
      { name: body.name, email: body.email, phone: body.phone, address: body.address },
      { new: true }
    );
    if (!updated) throw new ApiError('Customer not found', 404);
    return NextResponse.json({ customer: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    await connectDB();
    const { id } = await params;
    await Customer.findByIdAndDelete(id);
    await Vehicle.deleteMany({ customerId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
