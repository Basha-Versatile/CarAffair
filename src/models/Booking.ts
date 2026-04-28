import { Schema, model, models, type Model } from 'mongoose';

export interface BookingDoc {
  _id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  vehicleId?: string;
  registrationNumber: string;
  vehicleSummary?: string;
  notes?: string;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDoc>(
  {
    slotId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: String,
    vehicleId: String,
    registrationNumber: { type: String, required: true, index: true },
    vehicleSummary: String,
    notes: String,
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

export const Booking: Model<BookingDoc> =
  (models.Booking as Model<BookingDoc>) || model<BookingDoc>('Booking', bookingSchema);
