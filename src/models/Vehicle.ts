import { Schema, model, models, type Model } from 'mongoose';

export interface VehicleDoc {
  _id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  mileage: number;
  engineNumber?: string;
  chassisNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<VehicleDoc>(
  {
    customerId: { type: String, required: true, index: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    licensePlate: { type: String, required: true, index: true },
    vin: { type: String, required: true },
    mileage: { type: Number, default: 0 },
    engineNumber: String,
    chassisNumber: String,
  },
  { timestamps: true }
);

export const Vehicle: Model<VehicleDoc> =
  (models.Vehicle as Model<VehicleDoc>) || model<VehicleDoc>('Vehicle', vehicleSchema);
