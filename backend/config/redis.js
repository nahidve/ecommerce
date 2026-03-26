import { createClient } from "redis";
import logger from "./logger.js";

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

redisClient.on("error", (err) => {
  console.log("Redis error → falling back to DB:", err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Redis error", { error: err.message });
    logger.error("Redis connection failed, fallback to DB");
  }
}

// Safe GET (returns null if Redis fails)
export const safeRedisGet = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    return await redisClient.get(key);
  } catch (err) {
    logger.warn("Redis GET failed", { error: err.message });
    return null;
  }
};

// Safe SET (non-blocking)
export const safeRedisSet = async (key, value, options = {}) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.set(key, value, options);
  } catch (err) {
    console.error("Redis SET failed:", err.message);
  }
};

// Safe DEL
export const safeRedisDel = async (key) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis DEL failed:", err.message);
  }
};

// Safe LOCK (for idempotency)
export const acquireLock = async (key, ttlSeconds = 30) => {
  try {
    if (!redisClient.isOpen) return true; // fallback → allow request

    const result = await redisClient.set(key, "1", {
      NX: true,
      EX: ttlSeconds,
    });

    return !!result; // true if lock acquired
  } catch (err) {
    logger.warn("Redis LOCK failed, fallback to DB", { error: err.message });
    return true; // allow request (DB will protect)
  }
};

// Safe UNLOCK (optional)
export const releaseLock = async (key) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis UNLOCK failed:", err.message);
  }
};

export default redisClient;
