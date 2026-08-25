import type { Request, Response, NextFunction } from "express";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateRecord>();

// Clean up expired entries periodically every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000).unref();

export function createRateLimiter(options?: Partial<RateLimitConfig>) {
  const windowMs = options?.windowMs ?? 10000; // 10 seconds window default
  const maxRequests = options?.maxRequests ?? 10; // 10 requests max default

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = (req.headers["x-user-id"] as string) || (req.body?.discordId as string) || (req.query?.discordId as string) || req.ip || "anonymous";
    const guildId = (req.headers["x-guild-id"] as string) || "global";
    const command = (req.headers["x-command"] as string) || req.path;
    const interactionId = (req.headers["x-interaction-id"] as string) || (req.headers["x-button-id"] as string) || "";

    // Generate keys for user, guild, command, and interaction
    const keyParts = [userId, guildId, command];
    if (interactionId) keyParts.push(interactionId);
    const key = keyParts.join(":");

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now >= record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Too many requests. Please slow down.",
        retryAfterSeconds,
      });
    }

    record.count += 1;
    return next();
  };
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}
