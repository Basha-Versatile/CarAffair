import { Schema, model, models, type Model } from 'mongoose';

export interface VendorDoc {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories: string[];
  notes?: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<VendorDoc>(
  {
    name: { type: String, required: true, index: true },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    categories: { type: [String], default: [] },
    notes: String,
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && models.Vendor) {
  delete (models as Record<string, unknown>).Vendor;
}

export const Vendor: Model<VendorDoc> =
  (models.Vendor as Model<VendorDoc>) || model<VendorDoc>('Vendor', vendorSchema);
