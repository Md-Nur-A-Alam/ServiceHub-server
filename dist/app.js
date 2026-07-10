"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const node_1 = require("better-auth/node");
const betterAuth_1 = require("./config/betterAuth");
const rateLimit_middleware_1 = __importDefault(require("./middlewares/rateLimit.middleware"));
const v1_1 = __importDefault(require("./routes/v1"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
// Serverless-safe Database & Redis initialization middleware
app.use(async (req, res, next) => {
    try {
        await (0, db_1.connectDB)();
        await (0, redis_1.connectRedis)();
        next();
    }
    catch (error) {
        next(error);
    }
});
// Apply Rate Limiter to auth-adjacent routes BEFORE handling them
app.use("/api/auth/sign-in*", rateLimit_middleware_1.default);
app.use("/api/auth/sign-up*", rateLimit_middleware_1.default);
app.use("/api/auth/forget-password*", rateLimit_middleware_1.default);
app.use("/api/auth/reset-password*", rateLimit_middleware_1.default);
// Better Auth handler - mounted BEFORE express.json()
app.all("/api/auth/*", (0, node_1.toNodeHandler)(betterAuth_1.auth));
app.all("/api/auth/{*any}", (0, node_1.toNodeHandler)(betterAuth_1.auth));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Service Hub Server is healthy" });
});
// Throwaway test route for error formatting verification
app.get("/api/v1/test-error", (req, res) => {
    throw new ApiError_1.default(400, "Test error format validation succeeded");
});
// Routes
app.use("/api/v1", v1_1.default);
// Centralized error handler mounted last
app.use(error_middleware_1.default);
exports.default = app;
