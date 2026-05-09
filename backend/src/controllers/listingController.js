const Listing = require("../models/Listing");
const User = require("../models/User");
const { getRedis } = require("../config/redis");

// ── CREATE listing (host only) ─────────────────────
async function createListing(req, res) {
  try {
    if (req.user.role !== "host" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only hosts can create listings" });
    }

    const host = await User.findById(req.user.id);
    if (!host) return res.status(404).json({ error: "Host not found" });

    const listing = await Listing.create({
      ...req.body,
      host: {
        host_id:                host._id,
        host_name:              host.name,
        host_is_superhost:      host.host_profile?.is_superhost || false,
        host_identity_verified: host.host_profile?.is_verified  || false,
        host_picture_url:       host.avatar_url || "",
      },
    });

    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET ALL listings (with city cache) ────────────
async function getListings(req, res) {
  try {
    const { city, minPrice, maxPrice, beds, page = 1, limit = 10 } = req.query;
    const redis = getRedis();

    // Try cache if simple city query
    if (city && !minPrice && !maxPrice && !beds && page == 1) {
      const cacheKey = `listings:city:${city.toLowerCase()}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ source: "cache", data: JSON.parse(cached) });
      }
    }

    // Build filter
    const filter = { is_active: { $ne: false } };
    if (city)     filter["location.city"] = { $regex: city, $options: "i" };
    if (minPrice) filter.price_per_night  = { ...filter.price_per_night, $gte: Number(minPrice) };
    if (maxPrice) filter.price_per_night  = { ...filter.price_per_night, $lte: Number(maxPrice) };
    if (beds)     filter.beds             = { $gte: Number(beds) };

    const skip = (page - 1) * limit;
    const listings = await Listing.find(filter).skip(skip).limit(Number(limit));
    const total    = await Listing.countDocuments(filter);

    // Cache simple city queries 15 min
    if (city && !minPrice && !maxPrice && !beds && page == 1) {
      const cacheKey = `listings:city:${city.toLowerCase()}`;
      await redis.set(cacheKey, JSON.stringify(listings), "EX", 60 * 15);
    }

    res.json({ source: "db", total, page: Number(page), data: listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET ONE listing ────────────────────────────────
async function getListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── UPDATE listing (owner or admin) ───────────────
async function updateListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const isOwner = listing.host.host_id.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Invalidate cache
    const redis = getRedis();
    const city = updated.location?.city?.toLowerCase();
    if (city) await redis.del(`listings:city:${city}`);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── DELETE listing (owner or admin) ───────────────
async function deleteListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const isOwner = listing.host.host_id.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Listing.findByIdAndDelete(req.params.id);

    // Invalidate cache
    const redis = getRedis();
    const city = listing.location?.city?.toLowerCase();
    if (city) await redis.del(`listings:city:${city}`);

    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createListing, getListings, getListing, updateListing, deleteListing };