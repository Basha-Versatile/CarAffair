import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Vendor } from '@/models/Vendor';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    const docs = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    return NextResponse.json({ purchaseOrders: listJSON(docs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const me = await requireRole(ADMIN_ROLES);
    await connectDB();
    const body = await req.json();
    const { vendorId, items, relatedJobCardId, notes, send } = body ?? {};
    if (!vendorId) throw new ApiError('Vendor is required');
    if (!Array.isArray(items) || items.length === 0) throw new ApiError('Add at least one item');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new ApiError('Vendor not found', 404);
    const vendorDoc = vendor as unknown as { _id: unknown; name: string; status: string };
    if (vendorDoc.status === 'archived') throw new ApiError('This vendor is archived');

    const cleanedItems = items.map((it: Record<string, unknown>) => {
      const name = String(it.name ?? '').trim();
      const qty = Number(it.quantity);
      if (!name) throw new ApiError('Each item needs a name');
      if (!Number.isFinite(qty) || qty < 1) throw new ApiError(`Quantity for "${name}" must be at least 1`);
      return {
        id: typeof it.id === 'string' && it.id ? it.id : genId(),
        inventoryItemId: it.inventoryItemId ? String(it.inventoryItemId) : undefined,
        name,
        partNumber: it.partNumber ? String(it.partNumber).trim() : undefined,
        quantity: qty,
        notes: it.notes ? String(it.notes).trim() : undefined,
      };
    });

    const isSend = Boolean(send);
    const now = new Date();
    const created = await PurchaseOrder.create({
      vendorId: String(vendorDoc._id),
      vendorName: vendorDoc.name,
      items: cleanedItems,
      status: isSend ? 'requested' : 'draft',
      relatedJobCardId: relatedJobCardId ? String(relatedJobCardId) : undefined,
      notes: notes ? String(notes).trim() : undefined,
      vendorToken: randomBytes(24).toString('hex'),
      createdBy: me.sub,
      createdByName: me.name,
      sentAt: isSend ? now : undefined,
    });

    if (isSend) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const url = `${baseUrl}/vendor/${(created as unknown as { vendorToken: string }).vendorToken}`;
      console.log(`[PURCHASE_ORDER] vendor=${vendorDoc.name} url=${url}`);
    }

    return NextResponse.json({ purchaseOrder: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
