const { getRedis } = require("../config/redis");

// factory — crée un middleware avec les paramètres voulus
function rateLimit({ windowSec = 60, max = 20, keyPrefix = "rl" } = {}) {
  return async function (req, res, next) {
    try {
      const redis = getRedis();
      const ip    = req.ip || req.connection.remoteAddress;
      const key   = `${keyPrefix}:${ip}`;

      const current = await redis.incr(key);

      if (current === 1) {
        // Premier appel — on pose l'expiration
        await redis.expire(key, windowSec);
      }

      // Headers informatifs
      res.set("X-RateLimit-Limit",     max);
      res.set("X-RateLimit-Remaining", Math.max(0, max - current));

      if (current > max) {
        return res.status(429).json({
          error: `Too many requests — limit is ${max} per ${windowSec}s`,
        });
      }

      next();
    } catch (err) {
      // Si Redis est down, on laisse passer (fail open)
      next();
    }
  };
}

module.exports = rateLimit;