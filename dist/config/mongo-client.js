"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.mongoClient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Proxy for MongoClient
exports.mongoClient = new Proxy({}, {
    get(target, prop, receiver) {
        const client = mongoose_1.default.connection.getClient();
        if (!client) {
            throw new Error("Mongoose connection is not established. MongoClient is unavailable.");
        }
        const value = client[prop];
        if (typeof value === "function") {
            return value.bind(client);
        }
        return value;
    }
});
// Proxy for Db
exports.db = new Proxy({}, {
    get(target, prop, receiver) {
        const database = mongoose_1.default.connection.db;
        if (!database) {
            throw new Error("Mongoose connection is not established. Db instance is unavailable.");
        }
        const value = database[prop];
        if (typeof value === "function") {
            return value.bind(database);
        }
        return value;
    }
});
