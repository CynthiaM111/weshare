const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');
// Routes
router.post('/rides', authController.protect, rideController.createRide);
router.get('/rides', rideController.getRides);
router.get('/rides/search', rideController.searchRides);
router.get('/rides/booked', authController.protect, rideController.getUserRides);
router.get('/rides/employee', authController.protect, rideController.getEmployeeRides);
router.post('/rides/check-in', authController.protect, rideController.checkInPassenger);
router.get('/rides/history', authController.protect, rideController.getRideHistory);
router.get('/rides/private', authController.protect, rideController.getUserPrivateRides);
router.get('/rides/private/available', authController.protect, rideController.getAvailablePrivateRides);
router.get('/rides/:id', rideController.getRideById);
router.put('/rides/:id', authController.protect, rideController.updateRide);
router.delete('/rides/:id', authController.protect, rideController.deleteRide);

// Protected routes (require authentication)
router.post('/rides/:rideId/book', authController.protect, rideController.bookRide);

router.delete('/rides/:rideId/cancel', authController.protect, rideController.cancelRideBooking);


module.exports = router;