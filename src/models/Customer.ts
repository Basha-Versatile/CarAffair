import { Schema, model, models, type Model } from 'mongoose';

export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export const Customer: Model<CustomerDoc> =
  (models.Customer as Model<CustomerDoc>) || model<CustomerDoc>('Customer', customerSchema);
