import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

// Proxy for MongoClient
export const mongoClient = new Proxy({} as MongoClient, {
  get(target, prop, receiver) {
    const client = mongoose.connection.getClient() as any;
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
export const db = new Proxy({} as Db, {
  get(target, prop, receiver) {
    const database = mongoose.connection.db as any;
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
