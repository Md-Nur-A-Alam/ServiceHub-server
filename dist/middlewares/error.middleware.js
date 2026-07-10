"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message || "Internal Server Error",
        },
    });
};
exports.errorHandler = errorHandler;
