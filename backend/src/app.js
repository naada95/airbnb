const express      = require("express");
const cors         = require("cors");
const dotenv       = require("dotenv");
const cookieParser = require("cookie-parser");
const connectMongo = require("./config/mongo");
const connectRedis = require("./config/redis");
const rateLimit    = require("./middleware/rateLimit");

// ✅ Imports des routes — UNE SEULE FOIS
const authRoutes    = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const bookingRoutes = require("./routes/bookings");
const reviewRoutes  = require("./routes/reviews");
const adminRoutes   = require("./routes/admin");

dotenv.config();

const app = express();

// ── CORS en premier ──────────────────────────────────────────────────────────
app.use(cors({
  origin:         ["http://localhost:4200", "http://127.0.0.1:4200"],
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("/*splat", cors());

// ── Middlewares globaux ──────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(rateLimit({ windowSec: 60, max: 200, keyPrefix: "rl:global" }));
app.use("/api/auth/login",    rateLimit({ windowSec: 60, max: 10, keyPrefix: "rl:login" }));
app.use("/api/auth/register", rateLimit({ windowSec: 60, max: 10, keyPrefix: "rl:register" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews",  reviewRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/stay",     listingRoutes);   // alias frontend Angular

// ── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await connectMongo();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();