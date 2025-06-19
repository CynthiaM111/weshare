const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    protect,
    agencyOnly,
    status,
    employeeOnly,
    getAgencies,
    getAgencyCategories,
    getAgencyById,
    getDestinationCategoryById,
    verifyPhone,
    resendVerificationCode,
    sendOTP
} = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-phone', verifyPhone);
router.post('/resend-verification', resendVerificationCode);
router.post('/send-otp', sendOTP);
// Protected routes
router.get('/status', protect, status);
router.get('/agencies', getAgencies);
router.get('/agencies/:agencyId', protect, getAgencyById);
router.get('/agencies/:id/categories', getAgencyCategories);
router.get('/categories/:id', protect, getDestinationCategoryById);

module.exports = router;
