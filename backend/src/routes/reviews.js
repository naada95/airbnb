const express = require("express");
const router  = express.Router();
const { createReview, getListingReviews, deleteReview } = require("../controllers/reviewController");
const requireAuth = require("../middleware/auth");

router.post("/",                        requireAuth, createReview);
router.get("/listing/:listing_id",      getListingReviews);
router.delete("/:id",                   requireAuth, deleteReview);

module.exports = router;