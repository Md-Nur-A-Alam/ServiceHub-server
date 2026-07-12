import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  serviceId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can only favorite a service once
favoriteSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
