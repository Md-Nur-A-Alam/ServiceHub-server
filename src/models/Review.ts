import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  serviceId: mongoose.Types.ObjectId;
  userId: string;  // Better Auth user ID (string)
  rating: number;
  comment: string;
  images: string[];
  providerReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    userId: { type: String, required: true, index: true }, // Better Auth string ID
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    images: [{ type: String }],
    providerReply: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
