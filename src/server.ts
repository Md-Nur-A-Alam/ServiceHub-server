import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";

// Load environment variables
dotenv.config();

const port = process.env.PORT || 8000;

async function bootstrap() {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`[Server]: Service Hub Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("[Server]: Bootstrap failure:", error);
    process.exit(1);
  }
}

bootstrap();
