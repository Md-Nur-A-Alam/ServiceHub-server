import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema({
  title: { type: String, required: true },
});

export const Service = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
