/**
 * Cost Sharing Routes
 * API endpoints for cost sharing calculations
 */

const express = require('express');
const router = express.Router();
const CostController = require('../controllers/costController');
const CostSharingController = require('../controllers/costSharingController');

router.post('/validate', CostSharingController.validateCostSharingParams);

/**
 * @route   POST /api/cost-sharing/calculate/preview
 * @desc    Calculate pricing preview for ride creation
 * @access  Public
 */
router.post('/calculate/preview', CostController.calculatePricingPreview);


/**
 * @route   POST /api/cost-sharing/calculate/multiple
 * @desc    Calculate cost sharing for multiple rides
 * @access  Public
 */
router.post('/calculate/multiple', CostSharingController.calculateMultipleRidesCostSharing);


/**
 * @route   POST /api/cost-sharing/calculate/:rideId
 * @desc    Calculate cost sharing for a specific ride
 * @access  Public
 */
router.post('/calculate/:rideId', CostSharingController.calculateRideCostSharing);

/**
 * @route   GET /api/cost-sharing/calculate/:rideId/database
 * @desc    Calculate cost sharing using fuel cost from database
 * @access  Public
 */
router.get('/calculate/:rideId/database', CostSharingController.calculateRideCostSharingFromDatabase);

/**
 * @route   GET /api/cost-sharing/driver/:driverId/contribution
 * @desc    Calculate driver's fuel contribution for a period
 * @access  Public
 */
router.get('/driver/:driverId/contribution', CostSharingController.calculateDriverContribution);

/**
 * @route   POST /api/cost-sharing/rides/:rideId/savings
 * @desc    Calculate passenger savings for a ride
 * @access  Public
 */
router.post('/rides/:rideId/savings', CostSharingController.calculatePassengerSavings);

/**
 * @route   GET /api/cost-sharing/agency/:agencyId/stats
 * @desc    Get cost sharing statistics for an agency
 * @access  Public
 */
router.get('/agency/:agencyId/stats', CostSharingController.getAgencyCostSharingStats);

/**
 * @route   POST /api/cost-sharing/validate
 * @desc    Validate cost sharing parameters
 * @access  Public
 */

module.exports = router; 