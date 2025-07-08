/**
 * Fuel Cost Calculator Utilities
 * Provides comprehensive functions for calculating fuel consumption and costs
 */

const FuelCost = require('../models/fuelCost');
const dotenv = require('dotenv');
dotenv.config();

class FuelCostCalculator {
    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     * @param {number} lat1 - Starting latitude
     * @param {number} lon1 - Starting longitude
     * @param {number} lat2 - Ending latitude
     * @param {number} lon2 - Ending longitude
     * @returns {number} Distance in kilometers
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate fuel consumption based on distance and fuel efficiency
     * @param {number} distanceKm - Distance in kilometers
     * @param {number} fuelEfficiency - Fuel efficiency in L/100km
     * @returns {number} Fuel consumption in liters
     */
    static calculateFuelConsumption(distanceKm, fuelEfficiency) {
        if (distanceKm <= 0 || fuelEfficiency <= 0) {
            throw new Error('Distance and fuel efficiency must be greater than 0');
        }

        const fuelLiters = (distanceKm * fuelEfficiency) / 100;
        return Math.round(fuelLiters * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate fuel cost based on fuel consumption and price per liter
     * @param {number} fuelLiters - Fuel consumption in liters
     * @param {number} pricePerLiter - Price per liter
     * @returns {number} Total fuel cost
     */
    static calculateFuelCost(fuelLiters, pricePerLiter) {
        if (fuelLiters < 0 || pricePerLiter < 0) {
            throw new Error('Fuel liters and price per liter cannot be negative');
        }

        const fuelCost = fuelLiters * pricePerLiter;
        return Math.round(fuelCost * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate complete fuel cost estimation for a trip
     * @param {Object} params - Trip parameters
     * @param {number} params.startLat - Starting latitude
     * @param {number} params.startLon - Starting longitude
     * @param {number} params.endLat - Ending latitude
     * @param {number} params.endLon - Ending longitude
     * @param {number} params.fuelEfficiency - Fuel efficiency in L/100km
     * @param {number} params.pricePerLiter - Price per liter
     * @param {number} params.distanceKm - Optional: pre-calculated distance
     * @returns {Object} Complete fuel cost estimation
     */
    static calculateTripFuelCost(params) {
        const {
            startLat, startLon, endLat, endLon,
            fuelEfficiency, pricePerLiter, distanceKm
        } = params;

        // Validate inputs
        if (!startLat || !startLon || !endLat || !endLon) {
            throw new Error('All GPS coordinates are required');
        }
        if (!fuelEfficiency || fuelEfficiency <= 0) {
            throw new Error('Valid fuel efficiency is required');
        }
        if (!pricePerLiter || pricePerLiter < 0) {
            throw new Error('Valid price per liter is required');
        }

        // Calculate distance if not provided
        const calculatedDistance = distanceKm || this.calculateDistance(startLat, startLon, endLat, endLon);

        // Calculate fuel consumption
        const fuelLiters = this.calculateFuelConsumption(calculatedDistance, fuelEfficiency);

        // Calculate fuel cost
        const fuelCost = this.calculateFuelCost(fuelLiters, pricePerLiter);

        return {
            distanceKm: calculatedDistance,
            fuelLiters,
            fuelCost,
            costPerKm: calculatedDistance > 0 ? Math.round((fuelCost / calculatedDistance) * 100) / 100 : 0,
            fuelEfficiencyKmPerL: Math.round((100 / fuelEfficiency) * 100) / 100
        };
    }

    /**
     * Get current fuel price from environment or default
     * @returns {number} Current fuel price per liter
     */
    static getCurrentFuelPrice() {
        return parseFloat(process.env.DEFAULT_FUEL_PRICE_PER_LITER) || 1700; // Rwandan Francs
    }

    /**
     * Get default fuel efficiency based on vehicle type
     * @param {string} vehicleType - Type of vehicle
     * @returns {number} Default fuel efficiency in L/100km
     */
    static getDefaultFuelEfficiency(vehicleType = 'sedan') {
        const efficiencies = {
            'sedan': 7.0,
            'suv': 9.0,
            'truck': 12.0,
            'bus': 15.0,
            'motorcycle': 3.0,
            'hybrid': 5.0,
            'electric': 0.0 // Electric vehicles don't use fuel
        };

        return efficiencies[vehicleType.toLowerCase()] || 7.0;
    }

    /**
     * Calculate fuel cost with additional factors (traffic, terrain, etc.)
     * @param {Object} baseParams - Base calculation parameters
     * @param {Object} factors - Additional factors
     * @param {number} factors.trafficFactor - Traffic multiplier (1.0 = normal, 1.2 = heavy traffic)
     * @param {number} factors.terrainFactor - Terrain multiplier (1.0 = flat, 1.3 = hilly)
     * @param {number} factors.weatherFactor - Weather multiplier (1.0 = clear, 1.1 = rain)
     * @returns {Object} Adjusted fuel cost estimation
     */
    static calculateFuelCostWithFactors(baseParams, factors = {}) {
        const baseCalculation = this.calculateTripFuelCost(baseParams);

        const {
            trafficFactor = 1.0,
            terrainFactor = 1.0,
            weatherFactor = 1.0
        } = factors;

        // Apply factors to fuel consumption
        const adjustedFuelLiters = baseCalculation.fuelLiters * trafficFactor * terrainFactor * weatherFactor;
        const adjustedFuelCost = this.calculateFuelCost(adjustedFuelLiters, baseParams.pricePerLiter);

        return {
            ...baseCalculation,
            fuelLiters: Math.round(adjustedFuelLiters * 100) / 100,
            fuelCost: Math.round(adjustedFuelCost * 100) / 100,
            factors: {
                trafficFactor,
                terrainFactor,
                weatherFactor,
                totalFactor: trafficFactor * terrainFactor * weatherFactor
            }
        };
    }

    /**
     * Create a new fuel cost record in the database
     * @param {Object} tripData - Trip data including rideId
     * @returns {Promise<Object>} Created fuel cost record
     */
    static async createFuelCostRecord(tripData) {
        try {
            const fuelCost = new FuelCost(tripData);
            await fuelCost.save();
            return fuelCost;
        } catch (error) {
            throw new Error(`Failed to create fuel cost record: ${error.message}`);
        }
    }

    /**
     * Update fuel cost record with actual values after trip completion
     * @param {string} rideId - Ride ID (same as fuel cost record ID)
     * @param {number} actualFuelUsed - Actual fuel used in liters
     * @param {number} actualFuelCost - Actual fuel cost
     * @returns {Promise<Object>} Updated fuel cost record
     */
    static async updateFuelCostRecord(rideId, actualFuelUsed, actualFuelCost) {
        try {
            const fuelCost = await FuelCost.findOne({ rideId });
            if (!fuelCost) {
                throw new Error('Fuel cost record not found for this ride');
            }

            return await fuelCost.updateWithActualValues(actualFuelUsed, actualFuelCost);
        } catch (error) {
            throw new Error(`Failed to update fuel cost record: ${error.message}`);
        }
    }

    /**
     * Get fuel cost record by ride ID
     * @param {string} rideId - Ride ID
     * @returns {Promise<Object>} Fuel cost record
     */
    static async getFuelCostByRideId(rideId) {
        try {
            const fuelCost = await FuelCost.findOne({ rideId }).populate('rideId').populate('driverId');
            if (!fuelCost) {
                throw new Error('Fuel cost record not found for this ride');
            }
            return fuelCost;
        } catch (error) {
            throw new Error(`Failed to get fuel cost record: ${error.message}`);
        }
    }

    /**
     * Get fuel cost statistics for a driver
     * @param {string} driverId - Driver ID
     * @param {Date} startDate - Start date for statistics
     * @param {Date} endDate - End date for statistics
     * @returns {Promise<Object>} Fuel cost statistics
     */
    static async getDriverFuelStats(driverId, startDate, endDate) {
        try {
            const stats = await FuelCost.aggregate([
                {
                    $match: {
                        driverId: new require('mongoose').Types.ObjectId(driverId),
                        estimatedAt: { $gte: startDate, $lte: endDate },
                        status: { $in: ['completed', 'in_progress'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalTrips: { $sum: 1 },
                        totalDistance: { $sum: '$distanceKm' },
                        totalEstimatedFuel: { $sum: '$estimatedFuelLiters' },
                        totalEstimatedCost: { $sum: '$estimatedFuelCost' },
                        totalActualFuel: { $sum: '$actualFuelUsed' },
                        totalActualCost: { $sum: '$actualFuelCost' },
                        avgFuelEfficiency: { $avg: '$vehicleInfo.fuelEfficiency' }
                    }
                }
            ]);

            return stats[0] || {
                totalTrips: 0,
                totalDistance: 0,
                totalEstimatedFuel: 0,
                totalEstimatedCost: 0,
                totalActualFuel: 0,
                totalActualCost: 0,
                avgFuelEfficiency: 0
            };
        } catch (error) {
            throw new Error(`Failed to get driver fuel stats: ${error.message}`);
        }
    }

    /**
     * Get fuel cost statistics for an agency
     * @param {string} agencyId - Agency ID
     * @param {Date} startDate - Start date for statistics
     * @param {Date} endDate - End date for statistics
     * @returns {Promise<Object>} Fuel cost statistics
     */
    static async getAgencyFuelStats(agencyId, startDate, endDate) {
        try {
            const stats = await FuelCost.aggregate([
                {
                    $lookup: {
                        from: 'rides',
                        localField: 'rideId',
                        foreignField: '_id',
                        as: 'ride'
                    }
                },
                {
                    $unwind: '$ride'
                },
                {
                    $match: {
                        'ride.agencyId': new require('mongoose').Types.ObjectId(agencyId),
                        estimatedAt: { $gte: startDate, $lte: endDate },
                        status: { $in: ['completed', 'in_progress'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalTrips: { $sum: 1 },
                        totalDistance: { $sum: '$distanceKm' },
                        totalEstimatedFuel: { $sum: '$estimatedFuelLiters' },
                        totalEstimatedCost: { $sum: '$estimatedFuelCost' },
                        totalActualFuel: { $sum: '$actualFuelUsed' },
                        totalActualCost: { $sum: '$actualFuelCost' },
                        avgFuelEfficiency: { $avg: '$vehicleInfo.fuelEfficiency' }
                    }
                }
            ]);

            return stats[0] || {
                totalTrips: 0,
                totalDistance: 0,
                totalEstimatedFuel: 0,
                totalEstimatedCost: 0,
                totalActualFuel: 0,
                totalActualCost: 0,
                avgFuelEfficiency: 0
            };
        } catch (error) {
            throw new Error(`Failed to get agency fuel stats: ${error.message}`);
        }
    }
}

module.exports = FuelCostCalculator; 