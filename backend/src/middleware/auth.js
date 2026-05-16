const jwt          = require("jsonwebtoken");
const { getRedis } = require("../config/redis");

async function requireAuth(req, res, next) {
  try {
    // Accepte le token depuis le cookie OU le header Authorization
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token)
      return res.status(401).json({ error: "Non authentifié" });

    // Vérifier la signature JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que la session existe encore dans Redis
    const redis   = getRedis();
    const session = await redis.get(`session:${decoded.id}`);
    if (!session)
      return res.status(401).json({ error: "Session expirée, reconnectez-vous" });

    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = requireAuth;