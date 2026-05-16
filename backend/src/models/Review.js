const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  booking_id:  { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: "Booking" },
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  listing_id:  { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Listing" },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String },
  created_at:  { type: Date, default: Date.now },
});

reviewSchema.index({ listing_id: 1 });


module.exports = mongoose.model("Review", reviewSchema, "reviews");