const Listing = require("../models/Listing");
const User = require("../models/User");
const { getRedis } = require("../config/redis");

// Transforme un document Listing MongoDB → format Stay attendu par le frontend Angular
function toStayFormat(listing) {
  const doc = listing.toObject ? listing.toObject() : listing;
  return {
    _id:        doc._id,
    name:       doc.title,
    type:       doc.property_type || "",
    roomType:   doc.room_type || "",
    summary:    doc.description || "",
    price:      doc.price_per_night,
    capacity:   doc.accommodates || 0,
    bedrooms:   doc.bedrooms || 0,
    bathrooms:  doc.bathrooms || 0,
    amenities:  doc.amenities || [],
    imgUrls:    doc.photos || [],
    labels:     doc.labels || [],
    likedByUsers: doc.likedByUsers || [],
    reviews:    doc.reviews || [],
    statReviews: doc.statReviews || {
      cleanliness: 0, communication: 0, checkIn: 0,
      accuracy: 0, location: 0, value: 0
    },
    host: {
      _id:          doc.host?.host_id || "",
      fullname:     doc.host?.host_name || "",
      pictureUrl:   doc.host?.host_picture_url || "",
      thumbnailUrl: doc.host?.host_picture_url || "",
      isSuperhost:  doc.host?.host_is_superhost || false,
      responseTime: doc.host?.host_response_time || "",
      policyNumber: "",
      createAt:     0,
    },
    loc: {
      country:     doc.location?.country || "",
      countryCode: doc.location?.country_code || "",
      city:        doc.location?.city || "",
      address:     doc.location?.street || doc.location?.city || "",
      lat:         doc.location?.coordinates?.coordinates?.[1] || 0,
      lan:         doc.location?.coordinates?.coordinates?.[0] || 0,
    },
  };
}

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

    res.status(201).json(toStayFormat(listing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET ALL listings ────────────────────────────────
// Compatible avec les paramètres du frontend Angular :
//   ?page=0&label=...&likeByUser=...&hostId=...&isPetAllowed=...&place=...
// Et aussi les anciens paramètres backend : city, minPrice, maxPrice, beds
async function getListings(req, res) {
  try {
    const {
      page = 0, limit = 20,
      label, likeByUser, hostId, isPetAllowed, place,
      city, minPrice, maxPrice, beds,
    } = req.query;

    // Build filter
    const filter = { is_active: { $ne: false } };

    if (label)       filter.labels = label;
    if (likeByUser)  filter.likedByUsers = likeByUser;
    if (hostId)      filter["host.host_id"] = hostId;
    if (isPetAllowed === "true") filter.amenities = { $in: ["Pets allowed"] };
    if (place)       filter["location.city"] = { $regex: place, $options: "i" };
    if (city && !place) filter["location.city"] = { $regex: city, $options: "i" };
    if (minPrice) filter.price_per_night = { ...filter.price_per_night, $gte: Number(minPrice) };
    if (maxPrice) filter.price_per_night = { ...filter.price_per_night, $lte: Number(maxPrice) };
    if (beds)     filter.beds = { $gte: Number(beds) };

    // Pagination 0-based (frontend Angular)
    const skip = Number(page) * Number(limit);
    const listings = await Listing.find(filter).skip(skip).limit(Number(limit));

    // Retourne un tableau directement — format attendu par le frontend Angular
    res.json(listings.map(toStayFormat));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET total length ────────────────────────────────
// Frontend appelle : GET /api/stay/length/?page=0&...
async function getListingsLength(req, res) {
  try {
    const { label, likeByUser, hostId, isPetAllowed, place, city } = req.query;

    const filter = { is_active: { $ne: false } };
    if (label)       filter.labels = label;
    if (likeByUser)  filter.likedByUsers = likeByUser;
    if (hostId)      filter["host.host_id"] = hostId;
    if (isPetAllowed === "true") filter.amenities = { $in: ["Pets allowed"] };
    if (place)       filter["location.city"] = { $regex: place, $options: "i" };
    if (city && !place) filter["location.city"] = { $regex: city, $options: "i" };

    const total = await Listing.countDocuments(filter);
    res.json(total);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET ONE listing ────────────────────────────────
async function getListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(toStayFormat(listing));
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

    const redis = getRedis();
    const city = updated.location?.city?.toLowerCase();
    if (city) await redis.del(`listings:city:${city}`);

    res.json(toStayFormat(updated));
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

    const redis = getRedis();
    const city = listing.location?.city?.toLowerCase();
    if (city) await redis.del(`listings:city:${city}`);

    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createListing, getListings, getListing, updateListing, deleteListing, getListingsLength };