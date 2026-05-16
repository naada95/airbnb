const Redis = require("ioredis");

let client;

async function connectRedis() {
  client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS,
  });

  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("error", (err) => console.error("❌ Redis error:", err.message));
}

function getRedis() {
  return client;
}

module.exports = { connectRedis, getRedis };
// Fix app.js import
module.exports = connectRedis;
module.exports.getRedis = getRedis;