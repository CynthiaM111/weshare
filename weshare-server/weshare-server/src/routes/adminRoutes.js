const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// All admin routes require super admin authentication
router.use(authController.protect);
router.use(authController.superAdminOnly);

// User management routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Agency management routes
router.get('/agencies', adminController.getAllAgencies);

// Private rides management routes
router.get('/private-rides', adminController.getAllPrivateRides);

// System statistics routes
router.get('/stats', adminController.getSystemStats);

module.exports = router; 