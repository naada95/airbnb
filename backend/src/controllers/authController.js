const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getRedis } = require("../config/redis");

// ── REGISTER ──────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, role = "guest" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    // Check email not taken
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Build user based on role
    const userData = {
      name,
      email,
      password_hash: password, // pre-save hook will hash it
      role,
      preferences: { language: "fr", currency: "MAD", timezone: "Africa/Casablanca" },
    };

    if (role === "guest") {
      userData.guest_profile = { verified_id: false, wishlist_ids: [], total_trips: 0, is_superguest: false };
    } else if (role === "host") {
      userData.host_profile = { is_superhost: false, is_verified: false, total_listings: 0, member_since: new Date() };
    }

    const user = await User.create(userData);

    // Create JWT + store in Redis
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const redis = getRedis();
    await redis.set(`session:${token}`, JSON.stringify({
      id: user._id,
      role: user.role,
      currency: user.preferences.currency,
    }), "EX", 60 * 60 * 24 * 7); // 7 days

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// ── LOGIN ─────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Update last_login
    user.last_login = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const redis = getRedis();
    await redis.set(`session:${token}`, JSON.stringify({
      id: user._id,
      role: user.role,
      currency: user.preferences.currency,
    }), "EX", 60 * 60 * 24 * 7);

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── LOGOUT ────────────────────────────────────────
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const redis = getRedis();
      await redis.del(`session:${token}`);
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET ME ────────────────────────────────────────
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, logout, getMe };