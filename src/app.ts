import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRateLimiter from "./middlewares/rateLimit.middleware";
import v1Router from "./routes/v1";
import errorHandler from "./middlewares/error.middleware";
import ApiError from "./utils/ApiError";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL
].filter(Boolean) as string[];

// Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.endsWith(".vercel.app") || origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    return callback(new Error("Blocked by CORS policy"));
  },
  credentials: true,
}));

// Serverless-safe Database & Redis initialization middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    await connectRedis();
    next();
  } catch (error) {
    next(error);
  }
});

// Apply Rate Limiter to auth-adjacent routes BEFORE handling them
app.use([
  "/api/auth/sign-in/email",
  "/api/auth/sign-up/email",
  "/api/auth/request-password-reset",
  "/api/auth/reset-password"
], authRateLimiter);

// Better Auth handler - mounted BEFORE express.json()
app.all("/api/auth/*splat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _importDynamic = new Function('modulePath', 'return import(modulePath)');
    const { toNodeHandler } = await _importDynamic("better-auth/node");
    const { getAuth } = await import("./config/betterAuth");
    const auth = await getAuth();
    return toNodeHandler(auth)(req, res);
  } catch (error) {
    next(error);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Service Hub Server is healthy" });
});

// Throwaway test route for error formatting verification
app.get("/api/v1/test-error", (req: Request, res: Response) => {
  throw new ApiError(400, "Test error format validation succeeded");
});

// Routes
app.use("/api/v1", v1Router);

// Centralized error handler mounted last
app.use(errorHandler);

export default app;
