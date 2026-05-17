const jwt          = require("jsonwebtoken");
const { getRedis } = require("../config/redis");

async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const redis   = getRedis();
    const session = await redis.get(`session:${decoded.id}`);
    if (!session) {
      return res.status(401).json({ error: "Session expirée, reconnectez-vous" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = requireAuth;