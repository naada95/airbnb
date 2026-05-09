const express = require("express");
const router  = express.Router();
const {
  createBooking, getMyBookings, getListingBookings,
  cancelBooking, confirmBooking
} = require("../controllers/bookingController");
const requireAuth = require("../middleware/auth");

router.post("/",                              requireAuth, createBooking);
router.get("/my",                             requireAuth, getMyBookings);
router.get("/listing/:listing_id",            requireAuth, getListingBookings);
router.patch("/:id/cancel",                   requireAuth, cancelBooking);
router.patch("/:id/confirm",                  requireAuth, confirmBooking);

module.exports = router;