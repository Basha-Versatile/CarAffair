import { Schema, model, models, type Model } from 'mongoose';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff' | 'customer';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' },
    avatar: String,
  },
  { timestamps: true }
);

export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
