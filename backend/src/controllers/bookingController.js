const mongoose = require("mongoose")
const Booking  = require("../models/Booking")
const Listing  = require("../models/Listing")

// ── CREATE booking ─────────────────────────────────────────────────────────────
async function createBooking(req, res) {
  console.log('👤 req.user:', req.user)
  console.log('📦 req.body:', req.body)

  try {
    if (!["guest", "host", "admin"].includes(req.user.role)) {
  return res.status(403).json({ error: "Not authorized" });
}

    const {
      listing_id,
      check_in,
      check_out,
      guests_count,
      special_notes,
      total_price: clientPrice
    } = req.body

    if (!listing_id || !check_in || !check_out) {
      return res.status(400).json({
        error: "listing_id, check_in and check_out are required"
      })
    }

    if (!mongoose.Types.ObjectId.isValid(listing_id)) {
      return res.status(400).json({ error: "listing_id invalide" })
    }

    const checkInDate  = new Date(check_in)
    const checkOutDate = new Date(check_out)

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        error: "check_out must be after check_in"
      })
    }

    // Chercher le listing — optionnel
    const listing = await Listing.findById(listing_id).catch(() => null)

    // Calcul du prix
    let total_price

    if (listing && listing.price_per_night) {
      const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      )
      const computed = Math.round(
        nights * listing.price_per_night + (listing.cleaning_fee || 0)
      )
      if (computed && !isNaN(computed)) {
        total_price = computed
      }
    }

    // Fallback prix frontend
    if (!total_price || isNaN(total_price)) {
      total_price = Number(clientPrice)
    }

    if (!total_price || isNaN(total_price)) {
      return res.status(400).json({ error: "Cannot determine total price" })
    }

    // ✅ INSERT via driver natif — bypass validation Atlas
    const bookingData = {
      listing_id:   new mongoose.Types.ObjectId(listing_id),
      guest_id:     new mongoose.Types.ObjectId(req.user.id),
      check_in:     checkInDate,
      check_out:    checkOutDate,
      status:       listing?.instant_bookable ? "confirmed" : "pending",
      total_price:  Number(total_price),
      guests_count: Number(guests_count) || 1,
      created_at:   new Date(),
      ...(special_notes ? { special_notes } : {})
    }

    const result = await mongoose.connection.db
      .collection('bookings')
      .insertOne(bookingData)

    console.log('✅ Booking créé:', result.insertedId)

    res.status(201).json({
      _id: result.insertedId,
      ...bookingData
    })

  } catch (err) {
    console.error('❌ createBooking error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

// ── GET my bookings (guest) ────────────────────────────────────────────────────
async function getMyBookings(req, res) {
  try {
    const guestId = req.user.id || req.user._id

    const bookings = await Booking.find({ guest_id: guestId })
      .populate("listing_id", "title location price_per_night photos host")
      .sort({ check_in: -1 })

    res.json(bookings)

  } catch (err) {
    console.error('❌ getMyBookings error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

// ── GET bookings for a listing (host) ─────────────────────────────────────────
async function getListingBookings(req, res) {
  try {
    const listing = await Listing.findById(req.params.listing_id)

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    const userId  = (req.user.id || req.user._id).toString()
    const isOwner = listing.host?.host_id?.toString() === userId

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" })
    }

    const bookings = await Booking.find({ listing_id: req.params.listing_id })
      .sort({ check_in: 1 })

    res.json(bookings)

  } catch (err) {
    console.error('❌ getListingBookings error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

// ── CANCEL booking ─────────────────────────────────────────────────────────────
async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const userId  = (req.user.id || req.user._id).toString()
    const isGuest = booking.guest_id.toString() === userId

    if (!isGuest && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" })
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking already cancelled" })
    }

    booking.status = "cancelled"
    await booking.save()

    res.json({ message: "Booking cancelled", booking })

  } catch (err) {
    console.error('❌ cancelBooking error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

// ── CONFIRM booking (host) ─────────────────────────────────────────────────────
async function confirmBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const listing = await Listing.findById(booking.listing_id)

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    const userId  = (req.user.id || req.user._id).toString()
    const isOwner = listing.host?.host_id?.toString() === userId

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" })
    }

    booking.status = "confirmed"
    await booking.save()

    res.json({ message: "Booking confirmed", booking })

  } catch (err) {
    console.error('❌ confirmBooking error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getListingBookings,
  cancelBooking,
  confirmBooking
}