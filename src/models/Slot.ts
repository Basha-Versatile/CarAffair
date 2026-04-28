import { Schema, model, models, type Model } from 'mongoose';

export interface SlotDoc {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'disabled';
  bookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<SlotDoc>(
  {
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'disabled'],
      default: 'available',
      index: true,
    },
    bookingId: { type: String, index: true },
  },
  { timestamps: true }
);

slotSchema.index({ date: 1, startTime: 1 }, { unique: true });

export const Slot: Model<SlotDoc> = (models.Slot as Model<SlotDoc>) || model<SlotDoc>('Slot', slotSchema);
