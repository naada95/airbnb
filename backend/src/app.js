const express    = require("express");
const dotenv     = require("dotenv");
const connectMongo = require("./config/mongo");
const connectRedis = require("./config/redis");
const rateLimit  = require("./middleware/rateLimit");

dotenv.config();

const app = express();
app.use(express.json());

// Rate limiting
app.use(rateLimit({ windowSec: 60, max: 100, keyPrefix: "rl:global" }));
app.use("/api/auth/login",    rateLimit({ windowSec: 60, max: 10, keyPrefix: "rl:login" }));
app.use("/api/auth/register", rateLimit({ windowSec: 60, max: 10, keyPrefix: "rl:register" }));

// Routes
const authRoutes    = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const bookingRoutes = require("./routes/bookings");
const reviewRoutes  = require("./routes/reviews");

app.use("/api/auth",     authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews",  reviewRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  await connectMongo();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();