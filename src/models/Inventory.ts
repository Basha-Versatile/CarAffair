import { Schema, model, models, type Model } from 'mongoose';

const inventorySchema = new Schema(
  {
    name: { type: String, required: true },
    partNumber: { type: String, required: true, index: true },
    category: String,
    quantity: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    supplier: String,
  },
  { timestamps: true }
);

export const InventoryItem: Model<unknown> =
  (models.InventoryItem as Model<unknown>) || model('InventoryItem', inventorySchema);
