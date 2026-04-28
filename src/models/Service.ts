import { Schema, model, models, type Model } from 'mongoose';

const serviceSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    cost: { type: Number, default: 0 },
    laborHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ServiceCatalogItem: Model<unknown> =
  (models.ServiceCatalogItem as Model<unknown>) || model('ServiceCatalogItem', serviceSchema);
