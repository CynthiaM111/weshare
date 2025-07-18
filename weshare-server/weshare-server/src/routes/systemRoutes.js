const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// Public system settings route (no authentication required)
router.get('/settings', systemController.getPublicSystemSettings);

module.exports = router; 