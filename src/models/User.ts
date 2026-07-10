import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
