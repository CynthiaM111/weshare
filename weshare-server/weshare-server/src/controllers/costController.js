const FuelCostCalculator = require('../Utilities/fuelCostCalculator');
const CostSharingCalculator = require('../Utilities/costSharingCalculator');
const FuelCost = require('../models/fuelCost');

/**
 * Calculate cost sharing for a single ride
 * @route POST /api/cost/calculate/:rideId
 * @access Public
 */
const calculateCostSharing = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { fuelCost, fuelParams } = req.body;

        if (!fuelCost && !fuelParams) {
            return res.status(400).json({
                success: false,
                error: 'Either fuelCost or fuelParams must be provided'
            });
        }

        let calculatedFuelCost = fuelCost;

        if (fuelParams) {
            const { startLat, startLon, endLat, endLon, fuelEfficiency = 7.0, pricePerLiter = 1700 } = fuelParams;

            if (!startLat || !startLon || !endLat || !endLon) {
                return res.status(400).json({
                    success: false,
                    error: 'All GPS coordinates are required'
                });
            }

            // Calculate distance and fuel cost
            const distance = FuelCostCalculator.calculateDistance(startLat, startLon, endLat, endLon);
            const fuelLiters = FuelCostCalculator.calculateFuelConsumption(distance, fuelEfficiency);
            calculatedFuelCost = FuelCostCalculator.calculateFuelCost(fuelLiters, pricePerLiter);
        }

        // Get ride information from database
        const Ride = require('../models/ride');
        const ride = await Ride.findById(rideId);

        if (!ride) {
            return res.status(404).json({
                success: false,
                error: 'Ride not found'
            });
        }

        const totalSeats = ride.seats || 1;
        const costSharing = CostSharingCalculator.calculateCostSharing(calculatedFuelCost, totalSeats);

        res.json({
            success: true,
            data: {
                rideId,
                totalFuelCost: calculatedFuelCost,
                costSharing
            }
        });

    } catch (error) {
        console.error('Cost sharing calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate cost sharing'
        });
    }
};

/**
 * Calculate cost sharing using database fuel cost data
 * @route GET /api/cost/calculate/:rideId/database
 * @access Public
 */
const calculateCostSharingFromDatabase = async (req, res) => {
    try {
        const { rideId } = req.params;

        // Get ride information
        const Ride = require('../models/ride');
        const ride = await Ride.findById(rideId);

        if (!ride) {
            return res.status(404).json({
                success: false,
                error: 'Ride not found'
            });
        }

        // Get fuel cost data for this ride
        const fuelCostData = await FuelCost.findOne({ rideId });

        if (!fuelCostData) {
            return res.status(404).json({
                success: false,
                error: 'Fuel cost data not found for this ride'
            });
        }

        const totalSeats = ride.seats || 1;
        const costSharing = CostSharingCalculator.calculateCostSharing(fuelCostData.totalFuelCost, totalSeats);

        res.json({
            success: true,
            data: {
                rideId,
                fuelCostData,
                costSharing
            }
        });

    } catch (error) {
        console.error('Database cost sharing calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate cost sharing from database'
        });
    }
};

/**
 * Calculate cost sharing for multiple rides
 * @route POST /api/cost/calculate/multiple
 * @access Public
 */
const calculateMultipleRidesCostSharing = async (req, res) => {
    try {
        const { rides } = req.body;

        if (!Array.isArray(rides) || rides.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Rides array is required and must not be empty'
            });
        }

        const results = [];

        for (const rideData of rides) {
            const { rideId, totalSeats, bookedSeats, fuelCost } = rideData;

            if (!rideId || !totalSeats || !fuelCost) {
                results.push({
                    rideId,
                    success: false,
                    error: 'Missing required fields: rideId, totalSeats, fuelCost'
                });
                continue;
            }

            const availableSeats = totalSeats - (bookedSeats || 0);
            const costSharing = CostSharingCalculator.calculateCostSharing(fuelCost, availableSeats);

            results.push({
                rideId,
                success: true,
                data: {
                    totalFuelCost: fuelCost,
                    costSharing
                }
            });
        }

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Multiple rides cost sharing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate cost sharing for multiple rides'
        });
    }
};

/**
 * Calculate driver contribution over a time period
 * @route GET /api/cost/driver/:driverId/contribution
 * @access Public
 */
const calculateDriverContribution = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        const Ride = require('../models/ride');
        const rides = await Ride.find({
            driver: driverId,
            departure_time: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            status: { $in: ['completed', 'active'] }
        });

        let totalContribution = 0;
        let totalRides = 0;
        let totalFuelCost = 0;

        for (const ride of rides) {
            const fuelCostData = await FuelCost.findOne({ rideId: ride._id });
            if (fuelCostData) {
                const costSharing = CostSharingCalculator.calculateCostSharing(
                    fuelCostData.totalFuelCost,
                    ride.seats
                );
                totalContribution += costSharing.driverShare;
                totalFuelCost += fuelCostData.totalFuelCost;
                totalRides++;
            }
        }

        res.json({
            success: true,
            data: {
                driverId,
                period: { startDate, endDate },
                totalRides,
                totalFuelCost,
                totalContribution,
                averageContribution: totalRides > 0 ? totalContribution / totalRides : 0
            }
        });

    } catch (error) {
        console.error('Driver contribution calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate driver contribution'
        });
    }
};

/**
 * Calculate passenger savings over a time period
 * @route GET /api/cost/passenger/:passengerId/savings
 * @access Public
 */
const calculatePassengerSavings = async (req, res) => {
    try {
        const { passengerId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        // This would require a booking model to track passenger rides
        // For now, return a placeholder response
        res.json({
            success: true,
            data: {
                passengerId,
                period: { startDate, endDate },
                totalSavings: 0,
                totalRides: 0,
                averageSavings: 0
            }
        });

    } catch (error) {
        console.error('Passenger savings calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate passenger savings'
        });
    }
};

/**
 * Get agency cost sharing statistics
 * @route GET /api/cost/agency/:agencyId/stats
 * @access Public
 */
const getAgencyCostSharingStats = async (req, res) => {
    try {
        const { agencyId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        const Ride = require('../models/ride');
        const rides = await Ride.find({
            agencyId,
            departure_time: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        let totalFuelCost = 0;
        let totalDriverContribution = 0;
        let totalPassengerContribution = 0;
        let totalRides = 0;

        for (const ride of rides) {
            const fuelCostData = await FuelCost.findOne({ rideId: ride._id });
            if (fuelCostData) {
                const costSharing = CostSharingCalculator.calculateCostSharing(
                    fuelCostData.totalFuelCost,
                    ride.seats
                );
                totalFuelCost += fuelCostData.totalFuelCost;
                totalDriverContribution += costSharing.driverShare;
                totalPassengerContribution += costSharing.passengerShare;
                totalRides++;
            }
        }

        res.json({
            success: true,
            data: {
                agencyId,
                period: { startDate, endDate },
                totalRides,
                totalFuelCost,
                totalDriverContribution,
                totalPassengerContribution,
                averageFuelCost: totalRides > 0 ? totalFuelCost / totalRides : 0,
                averageDriverContribution: totalRides > 0 ? totalDriverContribution / totalRides : 0,
                averagePassengerContribution: totalRides > 0 ? totalPassengerContribution / totalRides : 0
            }
        });

    } catch (error) {
        console.error('Agency stats calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate agency statistics'
        });
    }
};

/**
 * Calculate pricing preview for ride creation
 * @route POST /api/cost/calculate/preview
 * @access Public
 */
const calculatePricingPreview = async (req, res) => {
    try {
        const {
            startLat,
            startLon,
            endLat,
            endLon,
            seats,
            fuelEfficiency = 7.0,
            pricePerLiter = 1700
        } = req.body;


        // Validate required parameters
        if (!startLat || !startLon || !endLat || !endLon || !seats) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: startLat, startLon, endLat, endLon, seats'
            });
        }

        // Validate numeric values
        const numSeats = parseInt(seats);
        const numFuelEfficiency = parseFloat(fuelEfficiency);
        const numPricePerLiter = parseFloat(pricePerLiter);

        if (isNaN(numSeats) || numSeats < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid seats value. Must be a positive integer.'
            });
        }

        if (isNaN(numFuelEfficiency) || numFuelEfficiency < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid fuel efficiency. Must be a positive number.'
            });
        }

        if (isNaN(numPricePerLiter) || numPricePerLiter < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid fuel price. Must be a positive number.'
            });
        }

        // Calculate distance
        const distance = FuelCostCalculator.calculateDistance(
            startLat, startLon, endLat, endLon
        );

        // Calculate fuel consumption
        const fuelLiters = FuelCostCalculator.calculateFuelConsumption(
            distance, numFuelEfficiency
        );

        // Calculate total fuel cost
        const totalFuelCost = FuelCostCalculator.calculateFuelCost(
            fuelLiters, numPricePerLiter
        );

        // Calculate cost sharing
        const driverShare = totalFuelCost * 0.25; // 25% for driver
        const passengerShare = totalFuelCost * 0.75; // 75% for passengers
        const perPassengerCost = numSeats > 0 ? passengerShare / numSeats : 0;

        const pricingData = {
            distance,
            fuelLiters,
            totalFuelCost,
            fuelEfficiency: numFuelEfficiency,
            pricePerLiter: numPricePerLiter,
            seats: numSeats,
            costSharing: {
                driverShare: Math.round(driverShare * 100) / 100,
                passengerShare: Math.round(passengerShare * 100) / 100,
                perPassengerCost: Math.round(perPassengerCost * 100) / 100,
                breakdown: {
                    driver: {
                        percentage: 25,
                        amount: Math.round(driverShare * 100) / 100,
                        description: 'Driver pays 25% of fuel cost'
                    },
                    passengers: {
                        percentage: 75,
                        totalAmount: Math.round(passengerShare * 100) / 100,
                        perPassenger: Math.round(perPassengerCost * 100) / 100,
                        description: `Passengers split 75% (${passengerShare.toFixed(2)} RWF) among ${numSeats} seats`
                    }
                }
            }
        };

        res.json({
            success: true,
            data: pricingData
        });

    } catch (error) {
        console.error('Pricing preview calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate pricing preview'
        });
    }
};

module.exports = {
    calculateCostSharing,
    calculateCostSharingFromDatabase,
    calculateMultipleRidesCostSharing,
    calculateDriverContribution,
    calculatePassengerSavings,
    getAgencyCostSharingStats,
    calculatePricingPreview
}; 