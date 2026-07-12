import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

// Load environment variables
dotenv.config();

if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
  console.log("[Sentry]: Initialized Sentry on server.");
}

import app from "./app";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";

const port = process.env.PORT || 8000;

async function bootstrap() {
  try {
    console.log("[Server]: Initializing bootstrap sequence...");
    // Connect to database
    await connectDB();
    
    // Connect to Redis
    await connectRedis();

    app.listen(port, () => {
      console.log(`[Server]: Service Hub Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("[Server]: Bootstrap critical failure:", error);
    process.exit(1);
  }
}

bootstrap();

export default app;
