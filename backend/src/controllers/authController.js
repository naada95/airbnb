const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const { getRedis } = require("../config/redis");

const SESSION_TTL = 7 * 24 * 60 * 60;

// ── REGISTER ──────────────────────────────────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email et password sont requis" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email:         email.toLowerCase(),
      password_hash,
      role:          role || "guest",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redis = getRedis();
    await redis.set(
      `session:${user._id}`,
      JSON.stringify({ userId: user._id, role: user.role }),
      'EX',
      SESSION_TTL
    );

    console.log(`✅ Nouvel utilisateur inscrit: ${user.email} (${user.role})`);

    res.status(201).json({
      token,
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        avatar_url: user.avatar_url || "",
      }
    });

  } catch (err) {
    console.error("register error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email et password requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redis = getRedis();
    await redis.set(
      `session:${user._id}`,
      JSON.stringify({ userId: user._id, role: user.role }),
      'EX',
      SESSION_TTL
    );

    console.log(`✅ Login: ${user.email} (${user.role})`);

    res.json({
      token,
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        avatar_url: user.avatar_url || "",
      }
    });

  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
async function logout(req, res) {
  try {
    const redis = getRedis();
    await redis.del(`session:${req.user.id}`);

    console.log(`✅ Logout: ${req.user.email}`);
    res.json({ message: "Déconnexion réussie" });

  } catch (err) {
    console.error("logout error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── GET ME ────────────────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const user = await User
      .findById(req.user.id)
      .select("-password_hash");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      avatar_url: user.avatar_url || "",
      created_at: user.created_at,
    });

  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, logout, getMe };