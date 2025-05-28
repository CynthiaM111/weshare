const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/status', authController.status);
router.get('/agencies', authController.getAgencies);
router.get('/agencies/:agencyId/categories', authController.getAgencyCategories);
router.get('/agencies/:agencyId/categories/:categoryId', authController.protect, authController.getDestinationCategoryById);
router.get('/agencies/:agencyId', authController.protect, authController.getAgencyById);
module.exports = router;
