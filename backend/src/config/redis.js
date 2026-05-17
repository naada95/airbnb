// backend/src/config/redis.js

const Redis = require("ioredis");

let client;

async function connectRedis() {
  client = new Redis({
    host:     process.env.REDIS_HOST,
    port:     process.env.REDIS_PORT,
    password: process.env.REDIS_PASS,
  });

  // Attendre que la connexion soit prête
  await new Promise((resolve, reject) => {
    client.on("connect", () => {
      console.log("✅ Redis connected");
      resolve();
    });
    client.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
      reject(err);
    });
  });

  return client;
}

function getRedis() {
  if (!client) {
    throw new Error("Redis not connected — call connectRedis() first");
  }
  return client;
}

// ✅ Export propre — connectRedis par défaut + getRedis nommé
module.exports = connectRedis;
module.exports.getRedis = getRedis;