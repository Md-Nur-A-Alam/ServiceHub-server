"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
async function connectDB() {
    if (isConnected)
        return;
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error("MONGODB_URI environment variable is missing.");
    await mongoose_1.default.connect(uri, { dbName: process.env.DB_NAME });
    isConnected = true;
    console.log("[Database]: MongoDB connected successfully.");
}
