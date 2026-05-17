// backend/src/routes/admin.js

const express      = require('express')
const router       = express.Router()
const mongoose     = require('mongoose')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/requireAdmin')
const User         = require('../models/User')
const Booking      = require('../models/Booking')
const Listing      = require('../models/Listing')

// Appliquer requireAuth + requireAdmin sur toutes les routes admin
router.use(requireAuth)
router.use(requireAdmin)

// ══════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [totalListings, totalUsers, totalBookings, revenueResult] = await Promise.all([
      Listing.countDocuments({}),
      User.countDocuments({}),
      Booking.countDocuments({}),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, revenue: { $sum: '$total_price' } } }
      ])
    ])

    res.json({
      totalListings,
      totalUsers,
      totalBookings,
      revenue: revenueResult[0]?.revenue || 0,
    })
  } catch (err) {
    console.error('admin getStats error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password_hash').sort({ created_at: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments({})
    res.json(count)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['guest', 'host', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' })
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password_hash')

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json({ message: 'Utilisateur supprimé', userId: req.params.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════
router.get('/bookings', async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query
    const filter = {}
    if (status) filter.status = status

    const bookings = await Booking
      .find(filter)
      .populate('listing_id', 'title photos price_per_night')
      .populate('guest_id', 'name email avatar_url')
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip))

    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/bookings/count', async (req, res) => {
  try {
    const count = await Booking.countDocuments({})
    res.json(count)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/bookings/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }
    const booking = await Booking.findByIdAndDelete(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Réservation non trouvée' })
    res.json({ message: 'Réservation supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════
// LISTINGS
// ══════════════════════════════════════════════════════════════
router.get('/listings', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query
    const listings = await Listing
      .find({})
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ created_at: -1 })
    res.json(listings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/listings/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }
    const listing = await Listing.findByIdAndDelete(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Listing non trouvé' })

    // Supprimer aussi les bookings liés
    await Booking.deleteMany({ listing_id: req.params.id })

    res.json({ message: 'Listing supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router