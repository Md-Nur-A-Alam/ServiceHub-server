import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  role: "customer" | "provider" | "admin";
  emailVerified: boolean;
  banned: boolean;
  provider?: {
    bio?: string;
    verified: boolean;
  };
  savedServices: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
    },
    emailVerified: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    provider: {
      bio: { type: String },
      verified: { type: Boolean, default: false },
    },
    savedServices: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
