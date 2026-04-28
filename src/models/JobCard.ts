import { Schema, model, models, type Model } from 'mongoose';

const serviceItemSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    cost: Number,
    laborHours: Number,
  },
  { _id: false }
);

const partItemSchema = new Schema(
  {
    id: String,
    name: String,
    partNumber: String,
    quantity: Number,
    unitCost: Number,
    totalCost: Number,
  },
  { _id: false }
);

const assignmentSchema = new Schema({ name: String, role: String }, { _id: false });

const photoSchema = new Schema(
  {
    id: String,
    dataUrl: String,
    capturedAt: String,
    latitude: Number,
    longitude: Number,
    locationLabel: String,
  },
  { _id: false }
);

const jobCardSchema = new Schema(
  {
    customerId: { type: String, required: true, index: true },
    customerName: String,
    vehicleId: { type: String, index: true },
    vehicleName: String,
    licensePlate: String,
    issues: [String],
    status: { type: String, enum: ['pending', 'approved', 'in_progress', 'completed'], default: 'pending', index: true },
    services: [serviceItemSchema],
    parts: [partItemSchema],
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    assignees: [assignmentSchema],
    notes: String,
    quoteToken: { type: String, index: true },
    quoteStatus: { type: String, enum: ['pending', 'sent', 'accepted', 'rejected'] },
    quoteSentAt: String,
    quoteRespondedAt: String,
    approvedServiceIds: [String],
    approvedPartIds: [String],
    quoteType: { type: String, enum: ['with_gst', 'proforma'] },
    quoteSubtotal: Number,
    quoteTaxAmount: Number,
    quoteTotal: Number,
    photos: [photoSchema],
  },
  { timestamps: true }
);

export const JobCard: Model<unknown> =
  (models.JobCard as Model<unknown>) || model('JobCard', jobCardSchema);
