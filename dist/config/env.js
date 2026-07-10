"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.env = {
    PORT: process.env.PORT || 8000,
    MONGODB_URI: process.env.MONGODB_URI || "",
    DB_NAME: process.env.DB_NAME || "ServiceHub_DB",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
