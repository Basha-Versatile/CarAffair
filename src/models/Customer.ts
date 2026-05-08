import { Schema, model, models, type Model } from 'mongoose';

export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true, index: true },
    address: { type: String, required: true },
    userId: { type: String, index: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && models.Customer) {
  delete (models as Record<string, unknown>).Customer;
}

export const Customer: Model<CustomerDoc> =
  (models.Customer as Model<CustomerDoc>) || model<CustomerDoc>('Customer', customerSchema);
