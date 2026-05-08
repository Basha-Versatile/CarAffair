import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const docs = await Vendor.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ vendors: listJSON(docs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const body = await req.json();
    const { name, contactPerson, phone, email, address, categories, notes } = body ?? {};
    if (!name || String(name).trim().length < 2) throw new ApiError('Vendor name is required');
    const created = await Vendor.create({
      name: String(name).trim(),
      contactPerson: contactPerson?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      address: address?.trim() || undefined,
      categories: Array.isArray(categories) ? categories.map((c) => String(c).trim()).filter(Boolean) : [],
      notes: notes?.trim() || undefined,
      status: 'active',
    });
    return NextResponse.json({ vendor: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
