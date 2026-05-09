const { getRedis } = require("../config/redis");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const redis = getRedis();
    const session = await redis.get(`session:${token}`);

    if (!session) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.user = JSON.parse(session);
    next();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = requireAuth;