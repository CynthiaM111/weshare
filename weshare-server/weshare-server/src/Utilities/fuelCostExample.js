/**
 * Fuel Cost Calculator Usage Examples
 * Demonstrates how to use the FuelCostCalculator utility
 */

const FuelCostCalculator = require('./fuelCostCalculator');
const FuelCost = require('../models/fuelCost');

// Example 1: Basic fuel cost calculation
async function basicFuelCostExample() {
    console.log('=== Basic Fuel Cost Calculation ===');

    const tripParams = {
        startLat: -1.9441, // Kigali coordinates
        startLon: 30.0619,
        endLat: -2.5966,   // Butare coordinates
        endLon: 29.7394,
        fuelEfficiency: 7.0, // 7L/100km
        pricePerLiter: 1700  // Rwandan Francs
    };

    try {
        const result = FuelCostCalculator.calculateTripFuelCost(tripParams);
        console.log('Trip Details:', result);

        // Create database record linked to a ride
        const fuelCostRecord = await FuelCostCalculator.createFuelCostRecord({
            rideId: '507f1f77bcf86cd799439011', // Example ride ID
            startLocation: {
                latitude: tripParams.startLat,
                longitude: tripParams.startLon,
                address: 'Kigali, Rwanda'
            },
            endLocation: {
                latitude: tripParams.endLat,
                longitude: tripParams.endLon,
                address: 'Butare, Rwanda'
            },
            distanceKm: result.distanceKm,
            estimatedFuelLiters: result.fuelLiters,
            estimatedFuelCost: result.fuelCost,
            vehicleInfo: {
                fuelEfficiency: tripParams.fuelEfficiency,
                fuelType: 'petrol',
                vehicleModel: 'Toyota Corolla'
            },
            fuelPricePerLiter: tripParams.pricePerLiter,
            driverId: '507f1f77bcf86cd799439012', // Example driver ID
            status: 'estimated'
        });

        console.log('Created fuel cost record for ride:', fuelCostRecord.rideId);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 2: Fuel cost with environmental factors
function fuelCostWithFactorsExample() {
    console.log('\n=== Fuel Cost with Environmental Factors ===');

    const baseParams = {
        startLat: -1.9441,
        startLon: 30.0619,
        endLat: -2.5966,
        endLon: 29.7394,
        fuelEfficiency: 7.0,
        pricePerLiter: 1700
    };

    const factors = {
        trafficFactor: 1.2,    // Heavy traffic
        terrainFactor: 1.3,    // Hilly terrain
        weatherFactor: 1.1     // Rainy weather
    };

    try {
        const result = FuelCostCalculator.calculateFuelCostWithFactors(baseParams, factors);
        console.log('Adjusted Trip Details:', result);
        console.log('Factors applied:', result.factors);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 3: Distance calculation only
function distanceCalculationExample() {
    console.log('\n=== Distance Calculation ===');

    // Kigali to Gisenyi
    const distance = FuelCostCalculator.calculateDistance(
        -1.9441, 30.0619, // Kigali
        -1.6944, 29.2578  // Gisenyi
    );

    console.log(`Distance from Kigali to Gisenyi: ${distance} km`);
}

// Example 4: Vehicle-specific fuel efficiency
function vehicleSpecificExample() {
    console.log('\n=== Vehicle-Specific Calculations ===');

    const vehicles = ['sedan', 'suv', 'truck', 'bus', 'motorcycle'];
    const distance = 100; // 100km trip

    vehicles.forEach(vehicleType => {
        const efficiency = FuelCostCalculator.getDefaultFuelEfficiency(vehicleType);
        const consumption = FuelCostCalculator.calculateFuelConsumption(distance, efficiency);
        const cost = FuelCostCalculator.calculateFuelCost(consumption, 1700);

        console.log(`${vehicleType.toUpperCase()}: ${consumption}L fuel, ${cost} RWF cost`);
    });
}

// Example 5: Update fuel cost record with actual values
async function updateFuelCostExample() {
    console.log('\n=== Updating Fuel Cost Record ===');

    try {
        // First create a record linked to a ride
        const tripData = {
            rideId: '507f1f77bcf86cd799439013', // Example ride ID
            startLocation: {
                latitude: -1.9441,
                longitude: 30.0619,
                address: 'Kigali, Rwanda'
            },
            endLocation: {
                latitude: -2.5966,
                longitude: 29.7394,
                address: 'Butare, Rwanda'
            },
            distanceKm: 135.5,
            vehicleInfo: {
                fuelEfficiency: 7.0,
                fuelType: 'petrol',
                vehicleModel: 'Toyota Corolla'
            },
            fuelPricePerLiter: 1700,
            estimatedFuelLiters: 9.5,
            estimatedFuelCost: 16150,
            driverId: '507f1f77bcf86cd799439012',
            status: 'in_progress'
        };

        const fuelCostRecord = await FuelCostCalculator.createFuelCostRecord(tripData);
        console.log('Created record for ride:', fuelCostRecord.rideId);

        // Simulate trip completion and update with actual values
        setTimeout(async () => {
            try {
                const updatedRecord = await FuelCostCalculator.updateFuelCostRecord(
                    fuelCostRecord.rideId, // Use rideId instead of tripId
                    10.2,  // Actual fuel used (liters)
                    17340  // Actual fuel cost (RWF)
                );

                console.log('Updated record:', {
                    rideId: updatedRecord.rideId,
                    estimatedFuel: updatedRecord.estimatedFuelLiters,
                    actualFuel: updatedRecord.actualFuelUsed,
                    costDifference: updatedRecord.costDifference,
                    status: updatedRecord.status
                });

            } catch (error) {
                console.error('Update error:', error.message);
            }
        }, 1000);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 6: Get fuel cost by ride ID
async function getFuelCostByRideExample() {
    console.log('\n=== Get Fuel Cost by Ride ID ===');

    try {
        const rideId = '507f1f77bcf86cd799439011';
        const fuelCost = await FuelCostCalculator.getFuelCostByRideId(rideId);
        console.log('Fuel cost for ride:', {
            rideId: fuelCost.rideId,
            distance: fuelCost.distanceKm,
            estimatedCost: fuelCost.estimatedFuelCost,
            actualCost: fuelCost.actualFuelCost,
            status: fuelCost.status
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 7: Get driver statistics
async function driverStatsExample() {
    console.log('\n=== Driver Fuel Statistics ===');

    try {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        const driverId = '507f1f77bcf86cd799439012';

        const stats = await FuelCostCalculator.getDriverFuelStats(driverId, startDate, endDate);
        console.log('Driver Statistics:', stats);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 8: Get agency statistics
async function agencyStatsExample() {
    console.log('\n=== Agency Fuel Statistics ===');

    try {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        const agencyId = '507f1f77bcf86cd799439014';

        const stats = await FuelCostCalculator.getAgencyFuelStats(agencyId, startDate, endDate);
        console.log('Agency Statistics:', stats);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run all examples
async function runAllExamples() {
    console.log('🚗 Fuel Cost Calculator Examples\n');

    await basicFuelCostExample();
    fuelCostWithFactorsExample();
    distanceCalculationExample();
    vehicleSpecificExample();
    await updateFuelCostExample();
    await getFuelCostByRideExample();
    await driverStatsExample();
    await agencyStatsExample();

    console.log('\n✅ All examples completed!');
}

// Export for use in other files
module.exports = {
    basicFuelCostExample,
    fuelCostWithFactorsExample,
    distanceCalculationExample,
    vehicleSpecificExample,
    updateFuelCostExample,
    getFuelCostByRideExample,
    driverStatsExample,
    agencyStatsExample,
    runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
} 