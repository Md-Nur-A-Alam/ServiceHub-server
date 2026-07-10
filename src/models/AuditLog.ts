import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema({
  action: { type: String, required: true },
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
