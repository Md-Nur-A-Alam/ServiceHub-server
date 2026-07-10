"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const v1_1 = __importDefault(require("./routes/v1"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
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
