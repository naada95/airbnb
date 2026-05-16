const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ["guest", "host", "admin"], required: true },
  avatar_url:    { type: String },
  phone:         { type: String },
  is_active:     { type: Boolean, default: true },
  preferences: {
    language: { type: String, default: "fr" },
    currency: { type: String, default: "MAD" },
    timezone: { type: String, default: "Africa/Casablanca" },
  },
  guest_profile: {
    verified_id:   { type: Boolean },
    wishlist_ids:  [{ type: mongoose.Schema.Types.ObjectId }],
    total_trips:   { type: Number, default: 0 },
    is_superguest: { type: Boolean, default: false },
  },
  host_profile: {
    is_superhost:    { type: Boolean, default: false },
    is_verified:     { type: Boolean, default: false },
    response_time:   { type: String },
    response_rate:   { type: Number },
    acceptance_rate: { type: Number },
    payout_currency: { type: String },
    payout_method:   { type: String },
    verifications:   [{ type: String }],
    about:           { type: String },
    languages_spoken:[{ type: String }],
    total_listings:  { type: Number, default: 0 },
    member_since:    { type: Date },
  },
  admin_profile: {
    permissions: [{ type: String }],
    department:  { type: String },
  },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date },
});

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password_hash")) return;
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

module.exports = mongoose.model("User", userSchema, "users");