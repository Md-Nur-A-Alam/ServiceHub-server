import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load .env configuration
dotenv.config({ path: path.join(__dirname, "../.env") });

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in environment variables.");
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || "ServiceHub_DB";
  console.log(`Connecting to database: ${dbName}...`);
  
  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  if (!db) {
    console.error("Failed to connect to DB");
    process.exit(1);
  }

  const email = "nuralam2812@gmail.com";
  const name = "Admin Nur";
  const password = "123456.Nur";

  console.log("Cleaning up existing user account if present...");
  await db.collection("user").deleteOne({ email: email.toLowerCase() });
  
  const userId = new mongoose.Types.ObjectId().toString();
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("Inserting user...");
  await db.collection("user").insertOne({
    _id: userId as any,
    name,
    email: email.toLowerCase(),
    emailVerified: true,
    role: "admin",
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log("Inserting credential account...");
  await db.collection("account").insertOne({
    _id: new mongoose.Types.ObjectId().toString() as any,
    userId,
    accountId: email.toLowerCase(),
    providerId: "credential",
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log("Admin account successfully created!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
