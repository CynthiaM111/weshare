const express = require('express');
const router = express.Router();
const { createAgency, getAgencies } = require('../controllers/agencyController');

router.post('/', createAgency);
router.get('/', getAgencies);

module.exports = router;