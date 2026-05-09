const Booking = require("../models/Booking");
const Listing = require("../models/Listing");

// ── CREATE booking ─────────────────────────────────
async function createBooking(req, res) {
  try {
    if (req.user.role !== "guest") {
      return res.status(403).json({ error: "Only guests can book listings" });
    }

    const { listing_id, check_in, check_out, guests_count, special_notes } = req.body;

    if (!listing_id || !check_in || !check_out) {
      return res.status(400).json({ error: "listing_id, check_in and check_out are required" });
    }

    const checkInDate  = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: "check_out must be after check_in" });
    }

    // Get listing
    const listing = await Listing.findById(listing_id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Check no overlapping confirmed bookings
    const overlap = await Booking.findOne({
      listing_id,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { check_in:  { $lt: checkOutDate }, check_out: { $gt: checkInDate } },
      ],
    });

    if (overlap) {
      return res.status(409).json({ error: "Listing not available for these dates" });
    }

    // Calculate price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const total_price = nights * listing.price_per_night + (listing.cleaning_fee || 0);

    const booking = await Booking.create({
      listing_id,
      guest_id: req.user.id,
      check_in:  checkInDate,
      check_out: checkOutDate,
      status: listing.instant_bookable ? "confirmed" : "pending",
      total_price,
      guests_count: guests_count || 1,
      special_notes,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET my bookings (guest) ────────────────────────
async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ guest_id: req.user.id })
      .populate("listing_id", "title location price_per_night photos")
      .sort({ check_in: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET bookings for a listing (host) ─────────────
async function getListingBookings(req, res) {
  try {
    const listing = await Listing.findById(req.params.listing_id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const isOwner = listing.host.host_id.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const bookings = await Booking.find({ listing_id: req.params.listing_id })
      .sort({ check_in: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── CANCEL booking ─────────────────────────────────
async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const isGuest = booking.guest_id.toString() === req.user.id;
    if (!isGuest && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── CONFIRM booking (host) ─────────────────────────
async function confirmBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const listing = await Listing.findById(booking.listing_id);
    const isOwner = listing.host.host_id.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createBooking, getMyBookings, getListingBookings, cancelBooking, confirmBooking };