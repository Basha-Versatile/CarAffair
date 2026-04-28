import { Schema, model, models, type Model } from 'mongoose';

const notificationSchema = new Schema(
  {
    jobCardId: { type: String, index: true },
    customerId: { type: String, index: true },
    customerName: String,
    channel: { type: String, enum: ['whatsapp', 'email'] },
    status: { type: String, enum: ['sent', 'delivered', 'opened', 'accepted', 'rejected'] },
    quoteToken: { type: String, index: true },
    message: String,
    sentAt: String,
    deliveredAt: String,
    openedAt: String,
    respondedAt: String,
  },
  { timestamps: true }
);

const alertSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'quote_accepted',
        'quote_rejected',
        'payment_received',
        'review_submitted',
        'job_created',
        'status_updated',
        'booking_created',
      ],
    },
    title: String,
    message: String,
    customerName: String,
    vehicleName: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification: Model<unknown> =
  (models.Notification as Model<unknown>) || model('Notification', notificationSchema);

export const Alert: Model<unknown> = (models.Alert as Model<unknown>) || model('Alert', alertSchema);
