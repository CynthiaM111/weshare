const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');
// Routes
router.post('/rides', authController.protect, authController.agencyOnly, rideController.createRide);
router.get('/rides', rideController.getRides);
router.get('/rides/search', rideController.searchRides);
router.get('/rides/booked', authController.protect, rideController.getUserRides);
router.get('/rides/employee', authController.protect, rideController.getEmployeeRides);
router.post('/rides/check-in', authController.protect, rideController.checkInPassenger);
router.get('/rides/:id', rideController.getRideById);
router.put('/rides/:id', authController.protect, authController.agencyOnly, rideController.updateRide);
router.delete('/rides/:id', authController.protect, authController.agencyOnly, rideController.deleteRide);

// Protected routes (require authentication)
router.post('/rides/:rideId/book', authController.protect, rideController.bookRide);

router.delete('/rides/:rideId/cancel', authController.protect, rideController.cancelRideBooking);


module.exports = router;