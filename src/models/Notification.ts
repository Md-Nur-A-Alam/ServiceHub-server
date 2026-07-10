import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
  message: { type: String, required: true },
});

export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
