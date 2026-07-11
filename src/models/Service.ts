import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  title: string;
  shortDesc: string;
  fullDesc: string;
  images: string[];
  price: number;
  category: string;
  location: string;
  providerId: string; // Better Auth user ID (string)
  ratingAvg: number;
  ratingCount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true },
    shortDesc: { type: String, required: true, trim: true },
    fullDesc: { type: String, required: true, trim: true },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true, lowercase: true, trim: true },
    location: { type: String, required: true, index: true, lowercase: true, trim: true },
    providerId: { type: String, required: true, index: true }, // Better Auth string ID
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for search and filtering
ServiceSchema.index({ title: "text", shortDesc: "text" });
ServiceSchema.index({ status: 1, category: 1 });
ServiceSchema.index({ status: 1, location: 1 });

export const Service = mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
export default Service;
