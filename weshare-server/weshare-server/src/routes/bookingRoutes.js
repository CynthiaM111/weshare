const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// GET /bookings - Get all bookings for analytics (agency only)
router.get('/bookings', authController.protect, bookingController.getBookings);

// GET /bookings/stats - Get booking statistics for analytics (agency only)
router.get('/bookings/stats', authController.protect, bookingController.getBookingStats);

module.exports = router; 