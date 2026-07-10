"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("@upstash/redis");
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
exports.redis = new redis_1.Redis({
    url: redisUrl || "",
    token: redisToken || "",
});
async function connectRedis() {
    if (!redisUrl || !redisToken) {
        console.warn("[Redis]: Warning - UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables are missing. Redis-based features (rate limiting, OTP verification) will be bypassed.");
        return false;
    }
    try {
        const pingResult = await exports.redis.ping();
        if (pingResult === "PONG") {
            console.log("[Redis]: Connected successfully to Upstash Redis (received PONG).");
            return true;
        }
        else {
            console.warn(`[Redis]: Connected but ping returned unexpected result: ${pingResult}`);
            return false;
        }
    }
    catch (error) {
        console.error("[Redis]: Connection test failed. Details:", error);
        return false;
    }
}
