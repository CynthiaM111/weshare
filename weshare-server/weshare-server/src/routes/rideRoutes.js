const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');
// Routes
router.post('/rides', authController.protect, rideController.createRide);
router.post('/rides/draft', authController.protect, rideController.createDraft);
router.get('/rides', rideController.getRides);
router.get('/rides/search', rideController.searchRides);
router.get('/rides/booked', authController.protect, rideController.getUserRides);
router.get('/rides/employee', authController.protect, rideController.getEmployeeRides);
router.get('/rides/drafts', authController.protect, rideController.getDrafts);
router.post('/rides/:id/publish', authController.protect, rideController.publishDraft);
router.post('/rides/check-in', authController.protect, rideController.checkInPassenger);
router.get('/rides/history', authController.protect, rideController.getRideHistory);
router.get('/rides/agency/history', authController.protect, rideController.getAgencyRideHistory);
router.get('/rides/private', authController.protect, rideController.getUserPrivateRides);
router.get('/rides/private/history', authController.protect, rideController.getUserPrivateRideHistory);
router.get('/rides/private/available', authController.protect, rideController.getAvailablePrivateRides);
router.get('/rides/:id', rideController.getRideById);
router.get('/rides/:id/bookings', authController.protect, rideController.getRideBookings);
router.put('/rides/:id', authController.protect, rideController.updateRide);
router.delete('/rides/:id', authController.protect, rideController.deleteRide);

// Protected routes (require authentication)
router.post('/rides/:rideId/book', authController.protect, rideController.bookRide);
router.delete('/rides/:rideId/cancel', authController.protect, rideController.cancelRideBooking);
router.patch('/rides/:rideId/cancel-ride', authController.protect, rideController.cancelRide);

// PIN-based completion routes for private rides
router.post('/rides/:rideId/generate-completion-pin', authController.protect, rideController.generateCompletionPin);
router.post('/rides/:rideId/complete-with-pin', authController.protect, rideController.completeRideWithPin);

router.post('/rides/cache/refresh', authController.protect, rideController.refreshCache);

module.exports = router;