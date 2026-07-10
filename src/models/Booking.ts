import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
});

export const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
