const Review  = require("../models/Review");
const Booking = require("../models/Booking");

// ── CREATE review ──────────────────────────────────
async function createReview(req, res) {
  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ error: "booking_id and rating are required" });
    }

    // Check booking exists and belongs to this guest
    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.guest_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only review your own bookings" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "You can only review completed bookings" });
    }

    // One review per booking (unique index handles it too)
    const existing = await Review.findOne({ booking_id });
    if (existing) return res.status(409).json({ error: "You already reviewed this booking" });

    const review = await Review.create({
      booking_id,
      reviewer_id: req.user.id,
      listing_id:  booking.listing_id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET reviews for a listing ──────────────────────
async function getListingReviews(req, res) {
  try {
    const reviews = await Review.find({ listing_id: req.params.listing_id })
      .populate("reviewer_id", "name avatar_url")
      .sort({ created_at: -1 });

    const avg = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : null;

    res.json({ average_rating: avg, total: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── DELETE review (author or admin) ───────────────
async function deleteReview(req, res) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const isAuthor = review.reviewer_id.toString() === req.user.id;
    if (!isAuthor && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createReview, getListingReviews, deleteReview };