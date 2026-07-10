import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";

export const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    return next();
  }

  try {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || req.ip || "unknown-ip";
    const key = `ratelimit:auth:${ip}`;
    const limit = 5;
    const windowSize = 600; // 10 minutes in seconds

    // Increment request count
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      // Set expiration on first request in the window
      await redis.expire(key, windowSize);
    }

    const ttl = await redis.ttl(key);

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
  } catch (error) {
    console.error("[RateLimiter]: Redis counter error:", error);
    // Fallback: don't block user requests if Redis fails
    next();
  }
};
export default authRateLimiter;
