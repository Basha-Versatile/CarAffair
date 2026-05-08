import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
    if (typeof body.contactPerson === 'string') update.contactPerson = body.contactPerson.trim() || undefined;
    if (typeof body.phone === 'string') update.phone = body.phone.trim() || undefined;
    if (typeof body.email === 'string') update.email = body.email.trim().toLowerCase() || undefined;
    if (typeof body.address === 'string') update.address = body.address.trim() || undefined;
    if (Array.isArray(body.categories)) {
      update.categories = body.categories.map((c: unknown) => String(c).trim()).filter(Boolean);
    }
    if (typeof body.notes === 'string') update.notes = body.notes.trim() || undefined;
    if (body.status === 'active' || body.status === 'archived') update.status = body.status;
    const updated = await Vendor.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError('Vendor not found', 404);
    return NextResponse.json({ vendor: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    // Block deletion if vendor has any non-final POs.
    const open = await PurchaseOrder.findOne({
      vendorId: id,
      status: { $in: ['requested', 'quoted', 'accepted', 'dispatched'] },
    });
    if (open) {
      throw new ApiError(
        'Cannot delete: this vendor has active purchase orders. Cancel them first or archive the vendor.',
        409
      );
    }
    await Vendor.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
