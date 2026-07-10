"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
if (!global.mongooseCached) {
    global.mongooseCached = { conn: null, promise: null };
}
const cached = global.mongooseCached;
async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI environment variable is missing.");
    }
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        console.log("[Database]: Initializing new Mongoose connection...");
        cached.promise = mongoose_1.default.connect(uri, {
            dbName: process.env.DB_NAME || "ServiceHub_DB",
        }).then((m) => m);
    }
    try {
        cached.conn = await cached.promise;
        console.log("[Database]: Mongoose connected successfully.");
        return cached.conn;
    }
    catch (error) {
        cached.promise = null;
        console.error("[Database]: Mongoose connection error:", error);
        throw error;
    }
}
