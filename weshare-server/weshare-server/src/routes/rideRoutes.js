const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');
// Routes
router.post('/rides', authController.protect, authController.agencyOnly, rideController.createRide);
router.get('/rides', rideController.getRides);
router.get('/rides/search', rideController.searchRides);
router.get('/rides/:id', rideController.getRideById);
router.put('/rides/:id', authController.protect, authController.agencyOnly, rideController.updateRide);
router.delete('/rides/:id', authController.protect, authController.agencyOnly, rideController.deleteRide);

// router.post('/rides/:id/book', rideController.bookRide);

module.exports = router;