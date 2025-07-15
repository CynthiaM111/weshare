const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    submitDriverVerification,
    getDriverProfile,
    updateDriverProfile
} = require('../controllers/driverVerificationController');

// Submit driver verification
router.post('/verify', authController.protect, submitDriverVerification);

// Get driver profile
router.get('/profile', authController.protect, getDriverProfile);

// Update driver profile
router.put('/profile', authController.protect, updateDriverProfile);

module.exports = router; 