import { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export const UserSchema = new Schema<UserDocument>({
  uid: { type: String, required: true, unique: true },
  email: { type: String },
  displayName: { type: String },
  photoURL: { type: String },
  provider: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});
