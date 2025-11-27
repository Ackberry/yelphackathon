import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences {
  defaultLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  favoriteCategories?: string[];
  dietaryRestrictions?: string[];
}

export interface IUser extends Document {
  clerkId: string;
  email: string;
  createdAt: Date;
  preferences: IUserPreferences;
}

const UserPreferencesSchema = new Schema(
  {
    defaultLocation: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String },
    },
    favoriteCategories: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    preferences: {
      type: UserPreferencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
