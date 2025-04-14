const express = require('express');
const router = express.Router();
const { createAgency } = require('../controllers/agencyController');

router.post('/', createAgency);

module.exports = router;