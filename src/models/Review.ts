import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema({
  comment: { type: String, required: true },
});

export const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
