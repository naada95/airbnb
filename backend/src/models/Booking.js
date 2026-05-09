const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  listing_id:    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Listing" },
  guest_id:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  check_in:      { type: Date, required: true },
  check_out:     { type: Date, required: true },
  status:        { type: String, enum: ["pending","confirmed","cancelled","completed"], default: "pending" },
  total_price:   { type: Number, required: true },
  guests_count:  { type: Number, min: 1, default: 1 },
  special_notes: { type: String },
  created_at:    { type: Date, default: Date.now },
});

bookingSchema.index({ listing_id: 1, check_in: 1, check_out: 1 });
bookingSchema.index({ guest_id: 1 });

module.exports = mongoose.model("Booking", bookingSchema, "bookings");