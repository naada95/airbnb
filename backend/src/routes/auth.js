const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getMe
} = require("../controllers/authController");

// ── Auth publique ─────────────────────────────────────────────────────────────
router.post("/register", register);   // POST /api/auth/register
router.post("/login",    login);      // POST /api/auth/login

// ── Auth protégée ─────────────────────────────────────────────────────────────
router.post("/logout",   requireAuth, logout);   // POST /api/auth/logout
router.get("/me",        requireAuth, getMe);    // GET  /api/auth/me
// ⚠️ ROUTE TEMPORAIRE — SUPPRIMER APRÈS USAGE
router.post("/reset-password", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const User   = require("../models/User");

  try {
    const { email, newPassword } = req.body;

    const password_hash = await bcrypt.hash(newPassword, 12);

    const user = await User.findOneAndUpdate(
      { email },
      { password_hash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Password reset OK",
      email:   user.email,
      role:    user.role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;