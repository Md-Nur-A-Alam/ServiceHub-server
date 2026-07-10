"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }
    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate field value entered";
    }
    // Mongoose CastError (e.g. invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Resource not found with id of ${err.value}`;
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode,
            message,
        },
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
