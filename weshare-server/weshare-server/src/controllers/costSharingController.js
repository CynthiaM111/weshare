/**
 * Cost Sharing Controller
 * Handles API endpoints for cost sharing calculations
 */

const CostSharingCalculator = require('../Utilities/costSharingCalculator');
const FuelCostCalculator = require('../Utilities/fuelCostCalculator');
const Ride = require('../models/ride');

class CostSharingController {
    /**
     * Calculate cost sharing for a specific ride
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async calculateRideCostSharing(req, res) {
        try {
            const { rideId } = req.params;
            const { fuelCost, fuelParams } = req.body;

            // Get ride information from database
            const ride = await Ride.findById(rideId);
            if (!ride) {
                return res.status(404).json({ error: 'Ride not found' });
            }

            // Calculate cost sharing
            const costSharing = CostSharingCalculator.calculateCostSharing({
                rideId,
                totalSeats: ride.seats,
                bookedSeats: ride.booked_seats,
                fuelCost,
                fuelParams
            });

            // Generate detailed report
            const report = CostSharingCalculator.generateCostSharingReport(costSharing, {
                from: ride.from,
                to: ride.to,
                distance: `${costSharing.totalFuelCost / 1700 * 100 / 7} km` // Approximate distance
            });

            res.json({
                success: true,
                data: {
                    costSharing,
                    report,
                    ride: {
                        id: ride._id,
                        from: ride.from,
                        to: ride.to,
                        seats: ride.seats,
                        bookedSeats: ride.booked_seats,
                        availableSeats: ride.seats - ride.booked_seats
                    }
                }
            });

        } catch (error) {
            console.error('Cost sharing calculation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Calculate cost sharing using fuel cost from database
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async calculateRideCostSharingFromDatabase(req, res) {
        try {
            const { rideId } = req.params;

            // Get ride information
            const ride = await Ride.findById(rideId);
            if (!ride) {
                return res.status(404).json({ error: 'Ride not found' });
            }

            // Calculate cost sharing using database fuel cost
            const costSharing = await CostSharingCalculator.calculateCostSharingFromDatabase(
                rideId,
                ride.seats,
                ride.booked_seats
            );

            res.json({
                success: true,
                data: {
                    costSharing,
                    ride: {
                        id: ride._id,
                        from: ride.from,
                        to: ride.to,
                        seats: ride.seats,
                        bookedSeats: ride.booked_seats,
                        availableSeats: ride.seats - ride.booked_seats
                    }
                }
            });

        } catch (error) {
            console.error('Database cost sharing calculation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Calculate cost sharing for multiple rides
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async calculateMultipleRidesCostSharing(req, res) {
        try {
            const { rides } = req.body;

            if (!Array.isArray(rides) || rides.length === 0) {
                return res.status(400).json({ error: 'Rides array is required' });
            }

            // Validate each ride
            const validationResults = rides.map(ride => ({
                rideId: ride.rideId,
                validation: CostSharingCalculator.validateCostSharingParams(ride)
            }));

            const invalidRides = validationResults.filter(result => !result.validation.isValid);
            if (invalidRides.length > 0) {
                return res.status(400).json({
                    error: 'Some rides have invalid parameters',
                    invalidRides
                });
            }

            // Calculate cost sharing for all rides
            const costSharingResults = CostSharingCalculator.calculateCostSharingForMultipleRides(rides);

            // Calculate totals
            const totals = costSharingResults.reduce((acc, result) => {
                if (!result.error) {
                    acc.totalFuelCost += result.totalFuelCost;
                    acc.totalDriverShare += result.driverShare;
                    acc.totalPassengerShare += result.passengerShare;
                    acc.totalRides++;
                }
                return acc;
            }, { totalFuelCost: 0, totalDriverShare: 0, totalPassengerShare: 0, totalRides: 0 });

            res.json({
                success: true,
                data: {
                    costSharingResults,
                    totals,
                    summary: {
                        totalRides: totals.totalRides,
                        totalFuelCost: totals.totalFuelCost,
                        averageFuelCostPerRide: totals.totalRides > 0 ? totals.totalFuelCost / totals.totalRides : 0,
                        totalDriverContribution: totals.totalDriverShare,
                        totalPassengerContribution: totals.totalPassengerShare
                    }
                }
            });

        } catch (error) {
            console.error('Multiple rides cost sharing error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Calculate driver's fuel contribution for a period
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async calculateDriverContribution(req, res) {
        try {
            const { driverId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and end date are required' });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const contribution = await CostSharingCalculator.calculateDriverFuelContribution(
                driverId,
                start,
                end
            );

            res.json({
                success: true,
                data: contribution
            });

        } catch (error) {
            console.error('Driver contribution calculation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Calculate passenger savings for a ride
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async calculatePassengerSavings(req, res) {
        try {
            const { rideId } = req.params;
            const { fullFuelCost } = req.body;

            if (!fullFuelCost || fullFuelCost <= 0) {
                return res.status(400).json({ error: 'Valid full fuel cost is required' });
            }

            // Get ride information
            const ride = await Ride.findById(rideId);
            if (!ride) {
                return res.status(404).json({ error: 'Ride not found' });
            }

            // Calculate cost sharing first
            const costSharing = await CostSharingCalculator.calculateCostSharingFromDatabase(
                rideId,
                ride.seats,
                ride.booked_seats
            );

            // Calculate savings
            const savings = CostSharingCalculator.calculatePassengerSavings(costSharing, fullFuelCost);

            res.json({
                success: true,
                data: {
                    costSharing,
                    savings,
                    ride: {
                        id: ride._id,
                        from: ride.from,
                        to: ride.to,
                        seats: ride.seats,
                        bookedSeats: ride.booked_seats
                    }
                }
            });

        } catch (error) {
            console.error('Passenger savings calculation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get cost sharing statistics for an agency
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAgencyCostSharingStats(req, res) {
        try {
            const { agencyId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and end date are required' });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            // Get agency fuel stats
            const fuelStats = await FuelCostCalculator.getAgencyFuelStats(agencyId, start, end);

            // Calculate cost sharing breakdown
            const totalFuelCost = fuelStats.totalActualCost || fuelStats.totalEstimatedCost;
            const totalDriverContribution = totalFuelCost * 0.25;
            const totalPassengerContribution = totalFuelCost * 0.75;

            const stats = {
                agencyId,
                period: { startDate: start, endDate: end },
                fuelStats,
                costSharing: {
                    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
                    totalDriverContribution: Math.round(totalDriverContribution * 100) / 100,
                    totalPassengerContribution: Math.round(totalPassengerContribution * 100) / 100,
                    averageDriverContributionPerTrip: fuelStats.totalTrips > 0 ?
                        Math.round((totalDriverContribution / fuelStats.totalTrips) * 100) / 100 : 0
                }
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Agency cost sharing stats error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Validate cost sharing parameters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static validateCostSharingParams(req, res) {
        try {
            const { params } = req.body;

            if (!params) {
                return res.status(400).json({ error: 'Parameters are required' });
            }

            const validation = CostSharingCalculator.validateCostSharingParams(params);

            res.json({
                success: true,
                data: validation
            });

        } catch (error) {
            console.error('Parameter validation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = CostSharingController; 