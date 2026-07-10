import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is missing.");
  await mongoose.connect(uri, { dbName: process.env.DB_NAME });
  isConnected = true;
  console.log("[Database]: MongoDB connected successfully.");
}
