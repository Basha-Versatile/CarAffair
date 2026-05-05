import { Schema, model, models, type Model } from 'mongoose';

export type UserRoleDb =
  | 'admin'
  | 'staff'
  | 'customer'
  | 'service_advisor'
  | 'mechanic'
  | 'primary_technician';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRoleDb;
  avatar?: string;
  status: 'invited' | 'active';
  inviteToken?: string;
  inviteExpiresAt?: Date;
  passwordSetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer', 'service_advisor', 'mechanic', 'primary_technician'],
      default: 'customer',
    },
    avatar: String,
    status: { type: String, enum: ['invited', 'active'], default: 'active', index: true },
    inviteToken: { type: String, index: true },
    inviteExpiresAt: Date,
    passwordSetAt: Date,
  },
  { timestamps: true }
);

// In dev, drop any cached compiled model so schema edits hot-reload.
// Mongoose keeps a process-wide registry; without this, schema changes are
// invisible until the Node process restarts.
if (process.env.NODE_ENV !== 'production' && models.User) {
  delete (models as Record<string, unknown>).User;
}

export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
