import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import v1Router from "./routes/v1";

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

// Routes
app.use("/api/v1", v1Router);

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
    },
  });
});

export default app;
