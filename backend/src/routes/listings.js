const express = require("express");
const router = express.Router();
const {
  createListing, getListings, getListing,
  updateListing, deleteListing, getListingsLength
} = require("../controllers/listingController");
const requireAuth = require("../middleware/auth");

router.get("/length/",  getListingsLength);  // /api/stay/length/?page=0&...
router.get("/",         getListings);        // public
router.get("/:id",      getListing);         // public
router.post("/",        requireAuth, createListing);
router.put("/:id",      requireAuth, updateListing);
router.delete("/:id",   requireAuth, deleteListing);

module.exports = router;