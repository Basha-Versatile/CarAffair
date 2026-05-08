import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PurchaseOrder, type PurchaseOrderItemDoc, type PurchaseOrderStatus } from '@/models/PurchaseOrder';
import { InventoryItem } from '@/models/Inventory';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

type Action = 'send' | 'accept' | 'reject' | 'dispatch' | 'receive' | 'cancel' | 'edit-items';

const ALLOWED_TRANSITIONS: Record<Action, PurchaseOrderStatus[]> = {
  send: ['draft'],
  accept: ['quoted'],
  reject: ['quoted'],
  dispatch: ['accepted'],
  receive: ['dispatched'],
  cancel: ['draft', 'requested', 'quoted', 'accepted', 'dispatched'],
  'edit-items': ['draft'],
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const po = await PurchaseOrder.findById(id);
    if (!po) throw new ApiError('Purchase order not found', 404);
    return NextResponse.json({ purchaseOrder: toJSON(po as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const action = body?.action as Action | undefined;
    if (!action) throw new ApiError('action is required');

    const existing = await PurchaseOrder.findById(id);
    if (!existing) throw new ApiError('Purchase order not found', 404);
    const doc = existing as unknown as {
      status: PurchaseOrderStatus;
      items: PurchaseOrderItemDoc[];
      _id: unknown;
    };

    const allowed = ALLOWED_TRANSITIONS[action];
    if (!allowed) throw new ApiError(`Unknown action "${action}"`);
    if (!allowed.includes(doc.status)) {
      throw new ApiError(
        `Cannot ${action} a purchase order in status "${doc.status}". Allowed: ${allowed.join(', ')}.`,
        409
      );
    }

    const now = new Date();
    const update: Record<string, unknown> = {};

    if (action === 'send') {
      update.status = 'requested';
      update.sentAt = now;
    } else if (action === 'accept') {
      update.status = 'accepted';
      update.acceptedAt = now;
    } else if (action === 'reject') {
      update.status = 'rejected';
      update.rejectedAt = now;
      if (typeof body.reason === 'string') update.rejectionReason = body.reason.trim();
    } else if (action === 'dispatch') {
      update.status = 'dispatched';
      update.dispatchedAt = now;
    } else if (action === 'cancel') {
      update.status = 'cancelled';
      update.cancelledAt = now;
      if (typeof body.reason === 'string') update.rejectionReason = body.reason.trim();
    } else if (action === 'edit-items') {
      // Only allowed in draft. Replace items with the new list.
      if (!Array.isArray(body.items)) throw new ApiError('items array is required');
      const cleanedItems = (body.items as Record<string, unknown>[]).map((it) => {
        const name = String(it.name ?? '').trim();
        const qty = Number(it.quantity);
        if (!name) throw new ApiError('Each item needs a name');
        if (!Number.isFinite(qty) || qty < 1) throw new ApiError(`Quantity for "${name}" must be at least 1`);
        return {
          id: typeof it.id === 'string' && it.id ? it.id : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          inventoryItemId: it.inventoryItemId ? String(it.inventoryItemId) : undefined,
          name,
          partNumber: it.partNumber ? String(it.partNumber).trim() : undefined,
          quantity: qty,
          notes: it.notes ? String(it.notes).trim() : undefined,
        };
      });
      update.items = cleanedItems;
    } else if (action === 'receive') {
      update.status = 'received';
      update.receivedAt = now;
      // Update inventory: bump quantity for items linked to inventory rows; refresh unitCost.
      for (const item of doc.items) {
        if (item.inventoryItemId) {
          const inv = await InventoryItem.findById(item.inventoryItemId);
          if (!inv) continue;
          const invDoc = inv as unknown as { quantity: number; unitCost: number };
          const newQty = (invDoc.quantity ?? 0) + item.quantity;
          const inventoryUpdate: Record<string, unknown> = { quantity: newQty };
          if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
            inventoryUpdate.unitCost = item.unitPrice;
          }
          await InventoryItem.findByIdAndUpdate(item.inventoryItemId, inventoryUpdate);
        }
      }
    }

    const updated = await PurchaseOrder.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError('Purchase order not found', 404);
    return NextResponse.json({ purchaseOrder: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const { id } = await params;
    const existing = await PurchaseOrder.findById(id);
    if (!existing) throw new ApiError('Purchase order not found', 404);
    const doc = existing as unknown as { status: PurchaseOrderStatus };
    if (doc.status !== 'draft') {
      throw new ApiError('Only draft purchase orders can be deleted. Use Cancel instead.', 409);
    }
    await PurchaseOrder.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
