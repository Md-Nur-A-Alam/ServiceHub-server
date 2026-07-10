import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";

// Load environment variables
dotenv.config();

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
