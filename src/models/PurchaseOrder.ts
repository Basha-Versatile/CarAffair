import { Schema, model, models, type Model } from 'mongoose';

export type PurchaseOrderStatus =
  | 'draft'
  | 'requested'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'dispatched'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderItemDoc {
  id: string;
  inventoryItemId?: string;
  name: string;
  partNumber?: string;
  quantity: number;
  notes?: string;
  // Vendor-quoted fields, filled when status reaches 'quoted'.
  unitPrice?: number;
  availableInDays?: number;
  vendorNote?: string;
}

export interface PurchaseOrderDoc {
  _id: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseOrderItemDoc[];
  status: PurchaseOrderStatus;
  relatedJobCardId?: string;
  notes?: string;
  vendorToken: string;
  createdBy: string;
  createdByName?: string;
  // State timestamps
  sentAt?: Date;
  quotedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  dispatchedAt?: Date;
  receivedAt?: Date;
  cancelledAt?: Date;
  // Optional admin reason on reject/cancel for audit.
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<PurchaseOrderItemDoc>(
  {
    id: { type: String, required: true },
    inventoryItemId: String,
    name: { type: String, required: true },
    partNumber: String,
    quantity: { type: Number, required: true, min: 1 },
    notes: String,
    unitPrice: Number,
    availableInDays: Number,
    vendorNote: String,
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema<PurchaseOrderDoc>(
  {
    vendorId: { type: String, required: true, index: true },
    vendorName: { type: String, required: true },
    items: { type: [itemSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'requested', 'quoted', 'accepted', 'rejected', 'dispatched', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    relatedJobCardId: { type: String, index: true },
    notes: String,
    vendorToken: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, required: true },
    createdByName: String,
    sentAt: Date,
    quotedAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    dispatchedAt: Date,
    receivedAt: Date,
    cancelledAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && models.PurchaseOrder) {
  delete (models as Record<string, unknown>).PurchaseOrder;
}

export const PurchaseOrder: Model<PurchaseOrderDoc> =
  (models.PurchaseOrder as Model<PurchaseOrderDoc>) ||
  model<PurchaseOrderDoc>('PurchaseOrder', purchaseOrderSchema);
