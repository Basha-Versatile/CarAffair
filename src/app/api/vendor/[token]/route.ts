import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PurchaseOrder, type PurchaseOrderItemDoc, type PurchaseOrderStatus } from '@/models/PurchaseOrder';
import { Alert } from '@/models/Notification';
import { ApiError, apiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

interface VendorAction {
  action: 'quote' | 'dispatch';
  items?: Array<{
    id: string;
    unitPrice?: number;
    availableInDays?: number;
    vendorNote?: string;
  }>;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const po = await PurchaseOrder.findOne({ vendorToken: token });
    if (!po) throw new ApiError('Purchase order link is invalid', 404);
    return NextResponse.json({ purchaseOrder: toJSON(po as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const body = (await req.json()) as VendorAction;
    const action = body?.action;
    if (action !== 'quote' && action !== 'dispatch') {
      throw new ApiError('Unsupported action');
    }

    const po = await PurchaseOrder.findOne({ vendorToken: token }).lean();
    if (!po) throw new ApiError('Purchase order link is invalid', 404);
    const doc = po as unknown as {
      status: PurchaseOrderStatus;
      items: PurchaseOrderItemDoc[];
      vendorName: string;
      _id: unknown;
    };

    const now = new Date();
    const update: Record<string, unknown> = {};

    if (action === 'quote') {
      // Vendor can quote when REQUESTED. They can also re-edit while still QUOTED
      // (until admin accepts/rejects).
      if (doc.status !== 'requested' && doc.status !== 'quoted') {
        throw new ApiError('This purchase order is not awaiting a quote.', 409);
      }
      const incoming = Array.isArray(body.items) ? body.items : [];
      const byId = new Map(incoming.map((i) => [i.id, i]));

      const merged = doc.items.map((item) => {
        const inc = byId.get(item.id);
        if (!inc) return item;
        const unitPrice = Number(inc.unitPrice);
        const availableInDays = Number(inc.availableInDays);
        return {
          ...item,
          unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : item.unitPrice,
          availableInDays:
            Number.isFinite(availableInDays) && availableInDays >= 0 ? availableInDays : item.availableInDays,
          vendorNote: typeof inc.vendorNote === 'string' ? inc.vendorNote.trim() || undefined : item.vendorNote,
        };
      });

      const allPriced = merged.every((m) => typeof m.unitPrice === 'number' && m.unitPrice > 0);
      if (!allPriced) {
        throw new ApiError('Please provide a unit price for every item before submitting.');
      }

      update.items = merged;
      update.status = 'quoted';
      update.quotedAt = now;

      // First-time quote → push admin alert. Re-edits don't create new alerts.
      if (doc.status === 'requested') {
        await Alert.create({
          type: 'vendor_quoted',
          title: 'Vendor responded with quote',
          message: `${doc.vendorName} submitted prices for purchase order #${String(doc._id).slice(-6)}`,
          customerName: doc.vendorName,
          read: false,
        });
      }
    } else if (action === 'dispatch') {
      if (doc.status !== 'accepted') {
        throw new ApiError('This purchase order has not been accepted yet.', 409);
      }
      update.status = 'dispatched';
      update.dispatchedAt = now;
      await Alert.create({
        type: 'vendor_dispatched',
        title: 'Vendor dispatched the parts',
        message: `${doc.vendorName} marked purchase order #${String(doc._id).slice(-6)} as dispatched`,
        customerName: doc.vendorName,
        read: false,
      });
    }

    const updated = await PurchaseOrder.findOneAndUpdate({ vendorToken: token }, update, { new: true });
    if (!updated) throw new ApiError('Purchase order link is invalid', 404);
    return NextResponse.json({ purchaseOrder: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}
