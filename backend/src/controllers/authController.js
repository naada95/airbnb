const User    = require("../models/User");
const jwt     = require("jsonwebtoken");
const { getRedis } = require("../config/redis");

// ── Génère un JWT et stocke la session dans Redis ──
async function generateSession(user, res) {
  const payload = { id: user._id, role: user.role, email: user.email };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

  // Stocker la session dans Redis avec TTL
  const redis = getRedis();
  const sessionKey = `session:${user._id}`;
  await redis.set(
    sessionKey,
    JSON.stringify({ role: user.role, email: user.email, name: user.name }),
    "EX",
    Number(process.env.SESSION_TTL || 86400)
  );

  // Cookie HttpOnly (plus sécurisé que localStorage)
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24h en ms
  });

  return token;
}

// ── REGISTER ──────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, role = "guest" } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Champs requis manquants" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email déjà utilisé" });

    const user = await User.create({
      name,
      email,
      password_hash: password, // hashé automatiquement par le pre-save hook
      role,
      is_active: true,
      created_at: new Date(),
      last_login: new Date(),
    });

    const token = await generateSession(user, res);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── LOGIN ─────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email et mot de passe requis" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Identifiants invalides" });

    if (user.is_active === false)
      return res.status(403).json({ error: "Compte désactivé" });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(401).json({ error: "Identifiants invalides" });

    // Mettre à jour last_login
    user.last_login = new Date();
    await user.save();

    const token = await generateSession(user, res);

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── LOGOUT ────────────────────────────────────────
async function logout(req, res) {
  try {
    if (req.user) {
      const redis = getRedis();
      await redis.del(`session:${req.user.id}`); // supprime la session Redis
    }
    res.clearCookie("token");
    res.json({ message: "Déconnecté" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── ME (profil connecté) ──────────────────────────
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, logout, getMe };