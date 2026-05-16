const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title:         { type: String, required: true, minlength: 5 },
  description:   { type: String },
  property_type: { type: String, enum: ["Entire apartment","Private room","Shared room","Entire house","Entire loft","Hotel room"] },
  room_type:     { type: String, required: true, enum: ["Entire home/apt","Private room","Shared room","Hotel room"] },
  cancellation_policy: { type: String, enum: ["flexible","moderate","strict","super_strict"] },

  accommodates: { type: Number, min: 1 },
  bedrooms:     { type: Number, min: 0 },
  beds:         { type: Number, min: 0 },
  bathrooms:    { type: Number, min: 0 },

  price_per_night:  { type: Number, required: true, min: 0 },
  security_deposit: { type: Number, min: 0 },
  cleaning_fee:     { type: Number, min: 0 },
  extra_people_fee: { type: Number, min: 0 },

  minimum_nights:   { type: Number, min: 1, default: 1 },
  maximum_nights:   { type: Number, min: 1, default: 30 },
  instant_bookable: { type: Boolean, default: false },

  host: {
    host_id:                { type: mongoose.Schema.Types.ObjectId, required: true },
    host_name:              { type: String, required: true },
    host_is_superhost:      { type: Boolean },
    host_response_time:     { type: String },
    host_response_rate:     { type: Number },
    host_identity_verified: { type: Boolean },
    host_picture_url:       { type: String },
  },

  location: {
    street:       { type: String },
    city:         { type: String, required: true },
    country:      { type: String, required: true },
    country_code: { type: String },
    coordinates: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
  },

  amenities: [{ type: String }],
  photos:    [{ type: String }],
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

listingSchema.index({ "location.coordinates": "2dsphere" });
listingSchema.index({ price_per_night: 1 });
listingSchema.index({ "host.host_id": 1 });

module.exports = mongoose.model("Listing", listingSchema, "listings");