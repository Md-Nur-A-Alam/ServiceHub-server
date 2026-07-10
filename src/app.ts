import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import v1Router from "./routes/v1";
import errorHandler from "./middlewares/error.middleware";
import ApiError from "./utils/ApiError";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
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
