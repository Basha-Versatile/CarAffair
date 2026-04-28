import { Schema, model, models, type Model } from 'mongoose';

const serviceItemSchema = new Schema(
  { id: String, name: String, description: String, cost: Number, laborHours: Number },
  { _id: false }
);

const partItemSchema = new Schema(
  { id: String, name: String, partNumber: String, quantity: Number, unitCost: Number, totalCost: Number },
  { _id: false }
);

const billSchema = new Schema(
  {
    jobCardId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: String,
    vehicleName: String,
    licensePlate: String,
    services: [serviceItemSchema],
    parts: [partItemSchema],
    servicesCost: Number,
    partsCost: Number,
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number,
    status: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'qr'] },
    paidAt: String,
    paymentToken: { type: String, index: true },
    paymentLinkStatus: { type: String, enum: ['pending', 'sent', 'viewed', 'paid'] },
    paymentLinkSentAt: String,
    reviewToken: { type: String, index: true },
    reviewStatus: { type: String, enum: ['pending', 'sent', 'submitted'] },
    reviewSentAt: String,
    reviewRating: Number,
    reviewComment: String,
    reviewSubmittedAt: String,
  },
  { timestamps: true }
);

export const Bill: Model<unknown> = (models.Bill as Model<unknown>) || model('Bill', billSchema);
