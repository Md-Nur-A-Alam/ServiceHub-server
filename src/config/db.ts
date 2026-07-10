import mongoose from "mongoose";

// Extend NodeJS global object to store cached mongoose connection
declare global {
  var mongooseCached: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

if (!global.mongooseCached) {
  global.mongooseCached = { conn: null, promise: null };
}

const cached = global.mongooseCached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[Database]: Initializing new Mongoose connection...");
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.DB_NAME || "ServiceHub_DB",
    }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log("[Database]: Mongoose connected successfully.");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("[Database]: Mongoose connection error:", error);
    throw error;
  }
}
