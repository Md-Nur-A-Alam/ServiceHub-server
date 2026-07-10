"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = void 0;
const redis_1 = require("../config/redis");
const authRateLimiter = async (req, res, next) => {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) {
        return next();
    }
    try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "unknown-ip";
        const key = `ratelimit:auth:${ip}`;
        const limit = 5;
        const windowSize = 600; // 10 minutes in seconds
        // Increment request count
        const currentCount = await redis_1.redis.incr(key);
        if (currentCount === 1) {
            // Set expiration on first request in the window
            await redis_1.redis.expire(key, windowSize);
        }
        const ttl = await redis_1.redis.ttl(key);
        if (currentCount > limit) {
            res.setHeader("Retry-After", ttl.toString());
            return res.status(429).json({
                success: false,
                error: {
                    code: 429,
                    message: `Too Many Requests - Please try again in ${Math.ceil(ttl / 60)} minutes.`,
                },
            });
        }
        next();
    }
    catch (error) {
        console.error("[RateLimiter]: Redis counter error:", error);
        // Fallback: don't block user requests if Redis fails
        next();
    }
};
exports.authRateLimiter = authRateLimiter;
exports.default = exports.authRateLimiter;
