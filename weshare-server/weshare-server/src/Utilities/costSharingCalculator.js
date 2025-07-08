/**
 * Cost Sharing Calculator
 * Handles fuel cost distribution between drivers and passengers
 */

const FuelCostCalculator = require('./fuelCostCalculator');
const FuelCost = require('../models/fuelCost');

class CostSharingCalculator {
    /**
     * Calculate cost sharing for a ride
     * @param {Object} rideData - Ride information
     * @param {string} rideData.rideId - Ride ID
     * @param {number} rideData.totalSeats - Total available seats
     * @param {number} rideData.bookedSeats - Number of booked seats
     * @param {number} rideData.fuelCost - Total fuel cost (optional, will calculate if not provided)
     * @param {Object} rideData.fuelParams - Fuel calculation parameters (if fuelCost not provided)
     * @returns {Object} Cost sharing breakdown
     */
    static calculateCostSharing(rideData) {
        const {
            rideId,
            totalSeats,
            bookedSeats,
            fuelCost,
            fuelParams
        } = rideData;

        // Validate inputs
        if (!rideId) {
            throw new Error('Ride ID is required');
        }
        if (!totalSeats || totalSeats <= 0) {
            throw new Error('Total seats must be greater than 0');
        }
        if (bookedSeats < 0 || bookedSeats > totalSeats) {
            throw new Error('Booked seats must be between 0 and total seats');
        }

        // Calculate or use provided fuel cost
        let totalFuelCost = fuelCost;
        if (!totalFuelCost && fuelParams) {
            const fuelCalculation = FuelCostCalculator.calculateTripFuelCost(fuelParams);
            totalFuelCost = fuelCalculation.fuelCost;
        }
        if (!totalFuelCost) {
            throw new Error('Either fuelCost or fuelParams must be provided');
        }

        // Calculate cost sharing
        const driverShare = totalFuelCost * 0.25; // 25% for driver
        const passengerShare = totalFuelCost * 0.75; // 75% for passengers

        // Calculate per-passenger cost
        const availableSeats = totalSeats - bookedSeats;
        const perPassengerCost = availableSeats > 0 ? passengerShare / availableSeats : 0;

        return {
            rideId,
            totalFuelCost: Math.round(totalFuelCost * 100) / 100,
            driverShare: Math.round(driverShare * 100) / 100,
            passengerShare: Math.round(passengerShare * 100) / 100,
            totalSeats,
            bookedSeats,
            availableSeats,
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
                    description: `Passengers split 75% (${passengerShare.toFixed(2)} RWF) among ${availableSeats} available seats`
                }
            }
        };
    }

    /**
     * Calculate cost sharing with actual fuel cost from database
     * @param {string} rideId - Ride ID
     * @param {number} totalSeats - Total available seats
     * @param {number} bookedSeats - Number of booked seats
     * @returns {Promise<Object>} Cost sharing breakdown
     */
    static async calculateCostSharingFromDatabase(rideId, totalSeats, bookedSeats) {
        try {
            // Get fuel cost from database
            const fuelCostRecord = await FuelCostCalculator.getFuelCostByRideId(rideId);

            if (!fuelCostRecord) {
                throw new Error('Fuel cost record not found for this ride');
            }

            const fuelCost = fuelCostRecord.actualFuelCost || fuelCostRecord.estimatedFuelCost;

            if (!fuelCost) {
                throw new Error('No fuel cost available for this ride');
            }

            return this.calculateCostSharing({
                rideId,
                totalSeats,
                bookedSeats,
                fuelCost
            });
        } catch (error) {
            throw new Error(`Failed to calculate cost sharing: ${error.message}`);
        }
    }

    /**
     * Calculate cost sharing for multiple rides
     * @param {Array} rides - Array of ride data
     * @returns {Array} Array of cost sharing breakdowns
     */
    static calculateCostSharingForMultipleRides(rides) {
        return rides.map(ride => {
            try {
                return this.calculateCostSharing(ride);
            } catch (error) {
                return {
                    rideId: ride.rideId,
                    error: error.message
                };
            }
        });
    }

    /**
     * Calculate driver's total fuel cost contribution for a period
     * @param {string} driverId - Driver ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>} Driver's fuel cost summary
     */
    static async calculateDriverFuelContribution(driverId, startDate, endDate) {
        try {
            const stats = await FuelCostCalculator.getDriverFuelStats(driverId, startDate, endDate);

            const totalFuelCost = stats.totalActualCost || stats.totalEstimatedCost;
            const driverContribution = totalFuelCost * 0.25; // 25% of total fuel cost

            return {
                driverId,
                period: { startDate, endDate },
                totalFuelCost: Math.round(totalFuelCost * 100) / 100,
                driverContribution: Math.round(driverContribution * 100) / 100,
                totalTrips: stats.totalTrips,
                totalDistance: stats.totalDistance,
                averageContributionPerTrip: stats.totalTrips > 0 ?
                    Math.round((driverContribution / stats.totalTrips) * 100) / 100 : 0
            };
        } catch (error) {
            throw new Error(`Failed to calculate driver contribution: ${error.message}`);
        }
    }

    /**
     * Calculate passenger savings compared to full fuel cost
     * @param {Object} costSharing - Cost sharing breakdown
     * @param {number} fullFuelCost - Full fuel cost without sharing
     * @returns {Object} Savings calculation
     */
    static calculatePassengerSavings(costSharing, fullFuelCost) {
        const perPassengerFullCost = fullFuelCost / costSharing.totalSeats;
        const savingsPerPassenger = perPassengerFullCost - costSharing.perPassengerCost;
        const totalSavings = savingsPerPassenger * costSharing.availableSeats;

        return {
            fullFuelCost: Math.round(fullFuelCost * 100) / 100,
            perPassengerFullCost: Math.round(perPassengerFullCost * 100) / 100,
            perPassengerSharedCost: costSharing.perPassengerCost,
            savingsPerPassenger: Math.round(savingsPerPassenger * 100) / 100,
            totalSavings: Math.round(totalSavings * 100) / 100,
            savingsPercentage: Math.round((savingsPerPassenger / perPassengerFullCost) * 100 * 100) / 100
        };
    }

    /**
     * Generate cost sharing report for a ride
     * @param {Object} costSharing - Cost sharing breakdown
     * @param {Object} rideInfo - Additional ride information
     * @returns {Object} Detailed cost sharing report
     */
    static generateCostSharingReport(costSharing, rideInfo = {}) {
        const report = {
            rideId: costSharing.rideId,
            timestamp: new Date(),
            fuelCost: {
                total: costSharing.totalFuelCost,
                currency: 'RWF'
            },
            costSharing: {
                driver: {
                    percentage: 25,
                    amount: costSharing.driverShare,
                    description: 'Driver contribution'
                },
                passengers: {
                    percentage: 75,
                    totalAmount: costSharing.passengerShare,
                    perPassenger: costSharing.perPassengerCost,
                    description: 'Passenger contribution (split evenly)'
                }
            },
            seating: {
                total: costSharing.totalSeats,
                booked: costSharing.bookedSeats,
                available: costSharing.availableSeats
            },
            summary: {
                driverPays: `${costSharing.driverShare} RWF (25%)`,
                eachPassengerPays: `${costSharing.perPassengerCost} RWF`,
                totalPassengerContribution: `${costSharing.passengerShare} RWF (75%)`
            }
        };

        // Add ride info if provided
        if (rideInfo.from && rideInfo.to) {
            report.route = {
                from: rideInfo.from,
                to: rideInfo.to,
                distance: rideInfo.distance
            };
        }

        return report;
    }

    /**
     * Validate cost sharing parameters
     * @param {Object} params - Parameters to validate
     * @returns {Object} Validation result
     */
    static validateCostSharingParams(params) {
        const errors = [];

        if (!params.rideId) {
            errors.push('Ride ID is required');
        }

        if (!params.totalSeats || params.totalSeats <= 0) {
            errors.push('Total seats must be greater than 0');
        }

        if (params.bookedSeats < 0 || params.bookedSeats > params.totalSeats) {
            errors.push('Booked seats must be between 0 and total seats');
        }

        if (!params.fuelCost && !params.fuelParams) {
            errors.push('Either fuelCost or fuelParams must be provided');
        }

        if (params.fuelCost && params.fuelCost < 0) {
            errors.push('Fuel cost cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = CostSharingCalculator; 